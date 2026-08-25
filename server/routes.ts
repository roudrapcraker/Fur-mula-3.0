import { Router, Request, Response } from 'express';
import { getDb, queryAll, runQuery, resetDatabase, persistDb } from './db.ts';

export const apiRouter = Router();

// 1. DASHBOARD & ANALYTICS STATS
apiRouter.get('/stats/dashboard', async (req: Request, res: Response) => {
  try {
    await getDb();
    
    // Pets stats
    const petStats = queryAll(`
      SELECT 
        COUNT(*) as total_pets,
        SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as available_pets,
        SUM(CASE WHEN status = 'Adopted' THEN 1 ELSE 0 END) as adopted_pets,
        SUM(CASE WHEN status = 'Under Treatment' THEN 1 ELSE 0 END) as treatment_pets
      FROM Pets
    `)[0] || {};

    // Adoptions stats
    const adoptionStats = queryAll(`
      SELECT 
        COUNT(*) as total_applications,
        SUM(CASE WHEN application_status = 'Approved' THEN 1 ELSE 0 END) as approved_adoptions,
        SUM(CASE WHEN application_status = 'Pending' THEN 1 ELSE 0 END) as pending_adoptions,
        SUM(CASE WHEN application_status = 'Rejected' THEN 1 ELSE 0 END) as rejected_adoptions
      FROM Adoptions
    `)[0] || {};

    // Financial totals
    const donationTotals = queryAll(`
      SELECT COUNT(*) as donation_count, COALESCE(SUM(amount), 0) as total_donations
      FROM Donations
    `)[0] || { donation_count: 0, total_donations: 0 };

    const orderTotals = queryAll(`
      SELECT COUNT(*) as order_count, COALESCE(SUM(total_amount), 0) as total_sales
      FROM Orders
    `)[0] || { order_count: 0, total_sales: 0 };

    // Inventory stats
    const inventoryStats = queryAll(`
      SELECT 
        COUNT(*) as total_products,
        SUM(CASE WHEN stock_quantity <= 5 THEN 1 ELSE 0 END) as low_stock_count,
        SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_count,
        COALESCE(SUM(price * stock_quantity), 0) as inventory_value
      FROM Pet_Products
    `)[0] || {};

    // Vet appointments stats
    const apptStats = queryAll(`
      SELECT 
        COUNT(*) as total_appointments,
        SUM(CASE WHEN appointment_date >= datetime('now') THEN 1 ELSE 0 END) as upcoming_appointments
      FROM Appointments
    `)[0] || {};

    // Species breakdown
    const speciesDistribution = queryAll(`
      SELECT b.species, COUNT(p.pet_id) as count
      FROM Pets p
      JOIN Breeds b ON p.breed_id = b.breed_id
      GROUP BY b.species
    `);

    // Top Breeds
    const topBreeds = queryAll(`
      SELECT b.breed_name, b.species, COUNT(p.pet_id) as pet_count
      FROM Breeds b
      LEFT JOIN Pets p ON b.breed_id = p.breed_id
      GROUP BY b.breed_id, b.breed_name, b.species
      ORDER BY pet_count DESC
      LIMIT 6
    `);

    // Recent activity stream
    const recentAdoptions = queryAll(`
      SELECT a.adoption_id, a.adoption_date, a.application_status, u.name as user_name, p.name as pet_name
      FROM Adoptions a
      JOIN Users u ON a.user_id = u.user_id
      JOIN Pets p ON a.pet_id = p.pet_id
      ORDER BY a.adoption_id DESC
      LIMIT 5
    `);

    const recentAppointments = queryAll(`
      SELECT app.appointment_id, app.appointment_date, app.reason, p.name as pet_name, v.doctor_name
      FROM Appointments app
      JOIN Pets p ON app.pet_id = p.pet_id
      JOIN Vets_Doctors v ON app.vet_id = v.vet_id
      ORDER BY app.appointment_date DESC
      LIMIT 5
    `);

    const recentOrders = queryAll(`
      SELECT o.order_id, o.order_date, o.total_amount, u.name as customer_name
      FROM Orders o
      JOIN Users u ON o.user_id = u.user_id
      ORDER BY o.order_date DESC
      LIMIT 5
    `);

    const recentDonations = queryAll(`
      SELECT d.donation_id, d.amount, d.donation_date, d.payment_method, u.name as donor_name
      FROM Donations d
      LEFT JOIN Users u ON d.user_id = u.user_id
      ORDER BY d.donation_date DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        petStats,
        adoptionStats,
        donationTotals,
        orderTotals,
        inventoryStats,
        apptStats,
        speciesDistribution,
        topBreeds,
        recentActivity: {
          recentAdoptions,
          recentAppointments,
          recentOrders,
          recentDonations
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. RAW SQL EXECUTOR (FOR DBMS CONSOLE & WORKBENCH)
apiRouter.post('/sql/execute', async (req: Request, res: Response) => {
  const { sql } = req.body;
  if (!sql || typeof sql !== 'string') {
    return res.status(400).json({ success: false, error: 'SQL query string required' });
  }

  const startTime = Date.now();
  try {
    const database = await getDb();
    const cleanSql = sql.trim();
    
    // Determine query type
    const isSelect = cleanSql.toUpperCase().startsWith('SELECT') || 
                    cleanSql.toUpperCase().startsWith('WITH') || 
                    cleanSql.toUpperCase().startsWith('EXPLAIN') ||
                    cleanSql.toUpperCase().startsWith('PRAGMA');

    if (isSelect) {
      const results = queryAll(cleanSql);
      const executionTimeMs = Date.now() - startTime;
      
      const columns = results.length > 0 ? Object.keys(results[0]) : [];
      return res.json({
        success: true,
        type: 'SELECT',
        rows: results,
        columns,
        rowCount: results.length,
        executionTimeMs
      });
    } else {
      // DDL or DML (INSERT, UPDATE, DELETE, CREATE, DROP, etc.)
      database.run(cleanSql);
      persistDb();
      const executionTimeMs = Date.now() - startTime;
      
      const changes = queryAll<{ c: number }>('SELECT changes() as c')[0]?.c || 0;
      const lastId = queryAll<{ id: number }>('SELECT last_insert_rowid() as id')[0]?.id || 0;

      return res.json({
        success: true,
        type: 'MUTATION',
        changes,
        lastInsertRowid: lastId,
        executionTimeMs,
        message: `Query executed successfully in ${executionTimeMs}ms. Affected rows: ${changes}`
      });
    }
  } catch (error: any) {
    const executionTimeMs = Date.now() - startTime;
    return res.status(400).json({
      success: false,
      error: error.message || 'SQL Execution Error',
      executionTimeMs
    });
  }
});

// 3. DATABASE SCHEMA & TABLE METADATA (FOR ER DIAGRAM & SCHEMA VIEWER)
apiRouter.get('/db/schema', async (req: Request, res: Response) => {
  try {
    await getDb();
    const tableNames = [
      'Users', 'Breeds', 'Pets', 'Adoptions', 'Vets_Doctors', 
      'Appointments', 'Medical_Records', 'Product_Categories', 
      'Pet_Products', 'Orders', 'Order_Items', 'Donations'
    ];

    const tablesSchema: any[] = [];

    for (const table of tableNames) {
      const tableInfo = queryAll(`PRAGMA table_info(${table})`);
      const foreignKeys = queryAll(`PRAGMA foreign_key_list(${table})`);
      const rowCount = queryAll(`SELECT COUNT(*) as count FROM ${table}`)[0]?.count || 0;

      tablesSchema.push({
        name: table,
        columns: tableInfo.map((col: any) => ({
          cid: col.cid,
          name: col.name,
          type: col.type,
          notnull: col.notnull === 1,
          dflt_value: col.dflt_value,
          pk: col.pk > 0
        })),
        foreignKeys: foreignKeys.map((fk: any) => ({
          id: fk.id,
          seq: fk.seq,
          table: fk.table,
          from: fk.from,
          to: fk.to,
          on_update: fk.on_update,
          on_delete: fk.on_delete
        })),
        rowCount
      });
    }

    res.json({ success: true, tables: tablesSchema });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. DATABASE RESET & RESTORE SEED
apiRouter.post('/db/reset', async (req: Request, res: Response) => {
  try {
    await getDb();
    resetDatabase();
    res.json({ success: true, message: 'Database reset to default 12 tables and seed data successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. EXPORT DATABASE AS SQL SCRIPT
apiRouter.get('/db/export-sql', async (req: Request, res: Response) => {
  try {
    await getDb();
    const tableNames = [
      'Users', 'Breeds', 'Pets', 'Adoptions', 'Vets_Doctors', 
      'Appointments', 'Medical_Records', 'Product_Categories', 
      'Pet_Products', 'Orders', 'Order_Items', 'Donations'
    ];

    let sqlDump = `-- Fur-mula 3.0 Database Backup Dump\n-- Generated on: ${new Date().toISOString()}\n\nPRAGMA foreign_keys = OFF;\n\n`;

    for (const table of tableNames) {
      const rows = queryAll(`SELECT * FROM ${table}`);
      if (rows.length > 0) {
        sqlDump += `-- Dumping data for table ${table}\n`;
        for (const row of rows) {
          const keys = Object.keys(row).join(', ');
          const values = Object.values(row).map(val => {
            if (val === null) return 'NULL';
            if (typeof val === 'number') return val;
            return `'${String(val).replace(/'/g, "''")}'`;
          }).join(', ');
          sqlDump += `INSERT INTO ${table} (${keys}) VALUES (${values});\n`;
        }
        sqlDump += '\n';
      }
    }
    sqlDump += 'PRAGMA foreign_keys = ON;\n';

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename=furmula3_backup.sql');
    res.send(sqlDump);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. GENERIC TABLE CRUD (FOR ALL 12 TABLES IN THE TABLE EXPLORER)
const VALID_TABLES = new Set([
  'Users', 'Breeds', 'Pets', 'Adoptions', 'Vets_Doctors', 
  'Appointments', 'Medical_Records', 'Product_Categories', 
  'Pet_Products', 'Orders', 'Order_Items', 'Donations'
]);

apiRouter.get('/tables/:tableName', async (req: Request, res: Response) => {
  const { tableName } = req.params;
  if (!VALID_TABLES.has(tableName)) {
    return res.status(400).json({ success: false, error: `Invalid table: ${tableName}` });
  }

  try {
    await getDb();
    const rows = queryAll(`SELECT * FROM ${tableName}`);
    const columns = queryAll(`PRAGMA table_info(${tableName})`);
    res.json({ success: true, tableName, columns, rows, total: rows.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/tables/:tableName', async (req: Request, res: Response) => {
  const { tableName } = req.params;
  if (!VALID_TABLES.has(tableName)) {
    return res.status(400).json({ success: false, error: `Invalid table: ${tableName}` });
  }

  try {
    await getDb();
    const data = req.body;
    const keys = Object.keys(data).filter(k => data[k] !== undefined && data[k] !== '');
    if (keys.length === 0) {
      return res.status(400).json({ success: false, error: 'No field data provided' });
    }

    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(k => data[k]);
    const sql = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;

    const result = runQuery(sql, values);
    res.json({ success: true, result, message: 'Record created successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

apiRouter.put('/tables/:tableName/:pkColumn/:pkValue', async (req: Request, res: Response) => {
  const { tableName, pkColumn, pkValue } = req.params;
  if (!VALID_TABLES.has(tableName)) {
    return res.status(400).json({ success: false, error: `Invalid table: ${tableName}` });
  }

  try {
    await getDb();
    const data = req.body;
    const updateKeys = Object.keys(data).filter(k => k !== pkColumn);
    if (updateKeys.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    const setClause = updateKeys.map(k => `${k} = ?`).join(', ');
    const values = [...updateKeys.map(k => data[k]), pkValue];
    const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${pkColumn} = ?`;

    const result = runQuery(sql, values);
    res.json({ success: true, result, message: 'Record updated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

apiRouter.delete('/tables/:tableName/:pkColumn/:pkValue', async (req: Request, res: Response) => {
  const { tableName, pkColumn, pkValue } = req.params;
  if (!VALID_TABLES.has(tableName)) {
    return res.status(400).json({ success: false, error: `Invalid table: ${tableName}` });
  }

  try {
    await getDb();
    const sql = `DELETE FROM ${tableName} WHERE ${pkColumn} = ?`;
    const result = runQuery(sql, [pkValue]);
    res.json({ success: true, result, message: 'Record deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 7. SPECIALIZED BUSINESS WORKFLOWS & DOMAIN APIS

// PETS WITH RICH DETAILS
apiRouter.get('/pets', async (req: Request, res: Response) => {
  try {
    await getDb();
    const pets = queryAll(`
      SELECT 
        p.pet_id, p.name, p.age, p.gender, p.status, p.breed_id,
        b.breed_name, b.species,
        (SELECT COUNT(*) FROM Medical_Records mr WHERE mr.pet_id = p.pet_id) as medical_count,
        (SELECT COUNT(*) FROM Appointments app WHERE app.pet_id = p.pet_id) as appointment_count,
        (SELECT COUNT(*) FROM Adoptions ad WHERE ad.pet_id = p.pet_id AND ad.application_status = 'Approved') as is_adopted_in_record
      FROM Pets p
      LEFT JOIN Breeds b ON p.breed_id = b.breed_id
      ORDER BY p.pet_id DESC
    `);
    res.json({ success: true, data: pets });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/pets', async (req: Request, res: Response) => {
  try {
    await getDb();
    const { name, age, gender, status = 'Available', breed_id } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Pet name is required' });

    const result = runQuery(
      'INSERT INTO Pets (name, age, gender, status, breed_id) VALUES (?, ?, ?, ?, ?)',
      [name, age ? parseFloat(age) : null, gender, status, breed_id ? parseInt(breed_id) : null]
    );
    res.json({ success: true, id: result.lastInsertRowid, message: 'Pet added to shelter successfully!' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

apiRouter.put('/pets/:id', async (req: Request, res: Response) => {
  try {
    await getDb();
    const { id } = req.params;
    const { name, age, gender, status, breed_id } = req.body;

    runQuery(
      'UPDATE Pets SET name = ?, age = ?, gender = ?, status = ?, breed_id = ? WHERE pet_id = ?',
      [name, age !== undefined ? parseFloat(age) : null, gender, status, breed_id !== undefined ? parseInt(breed_id) : null, id]
    );
    res.json({ success: true, message: 'Pet updated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ADOPTIONS WITH PREVENT DOUBLE-ADOPTION & AUTO STATUS LOGIC
apiRouter.get('/adoptions', async (req: Request, res: Response) => {
  try {
    await getDb();
    const adoptions = queryAll(`
      SELECT 
        a.adoption_id, a.user_id, a.pet_id, a.adoption_date, a.application_status,
        u.name as user_name, u.email as user_email, u.phone as user_phone, u.address as user_address,
        p.name as pet_name, p.status as pet_status, p.age as pet_age, p.gender as pet_gender,
        b.breed_name, b.species
      FROM Adoptions a
      JOIN Users u ON a.user_id = u.user_id
      JOIN Pets p ON a.pet_id = p.pet_id
      LEFT JOIN Breeds b ON p.breed_id = b.breed_id
      ORDER BY a.adoption_id DESC
    `);
    res.json({ success: true, data: adoptions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/adoptions', async (req: Request, res: Response) => {
  try {
    await getDb();
    const { user_id, pet_id, adoption_date, application_status = 'Pending' } = req.body;
    if (!user_id || !pet_id) {
      return res.status(400).json({ success: false, error: 'User and Pet are required' });
    }

    // Check pet status
    const pet = queryAll('SELECT * FROM Pets WHERE pet_id = ?', [pet_id])[0];
    if (!pet) return res.status(404).json({ success: false, error: 'Pet not found' });
    if (pet.status === 'Adopted') {
      return res.status(400).json({ success: false, error: 'This pet has already been adopted!' });
    }

    const date = adoption_date || new Date().toISOString().split('T')[0];
    const result = runQuery(
      'INSERT INTO Adoptions (user_id, pet_id, adoption_date, application_status) VALUES (?, ?, ?, ?)',
      [user_id, pet_id, date, application_status]
    );

    // If application is created as Approved right away, update pet to Adopted and user to Adopter
    if (application_status === 'Approved') {
      runQuery("UPDATE Pets SET status = 'Adopted' WHERE pet_id = ?", [pet_id]);
      runQuery("UPDATE Users SET user_type = 'Adopter' WHERE user_id = ?", [user_id]);
    }

    res.json({ success: true, id: result.lastInsertRowid, message: 'Adoption application registered successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

apiRouter.patch('/adoptions/:id/status', async (req: Request, res: Response) => {
  try {
    await getDb();
    const { id } = req.params;
    const { status } = req.body;
    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid adoption status' });
    }

    const adoption = queryAll('SELECT * FROM Adoptions WHERE adoption_id = ?', [id])[0];
    if (!adoption) return res.status(404).json({ success: false, error: 'Adoption record not found' });

    runQuery('UPDATE Adoptions SET application_status = ? WHERE adoption_id = ?', [status, id]);

    if (status === 'Approved') {
      // Set pet status to Adopted
      runQuery("UPDATE Pets SET status = 'Adopted' WHERE pet_id = ?", [adoption.pet_id]);
      // Update user type to Adopter
      runQuery("UPDATE Users SET user_type = 'Adopter' WHERE user_id = ?", [adoption.user_id]);
      // Reject any other pending applications for this same pet to prevent collision
      runQuery(
        "UPDATE Adoptions SET application_status = 'Rejected' WHERE pet_id = ? AND adoption_id != ? AND application_status = 'Pending'",
        [adoption.pet_id, id]
      );
    } else if (status === 'Rejected' || status === 'Pending') {
      // Check if pet has any other approved adoptions
      const hasOtherApproved = queryAll(
        "SELECT * FROM Adoptions WHERE pet_id = ? AND application_status = 'Approved' AND adoption_id != ?",
        [adoption.pet_id, id]
      ).length > 0;
      if (!hasOtherApproved) {
        runQuery("UPDATE Pets SET status = 'Available' WHERE pet_id = ?", [adoption.pet_id]);
      }
    }

    res.json({ success: true, message: `Adoption application status updated to ${status}` });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// APPOINTMENTS & VET CLINIC
apiRouter.get('/appointments', async (req: Request, res: Response) => {
  try {
    await getDb();
    const appointments = queryAll(`
      SELECT 
        app.appointment_id, app.pet_id, app.vet_id, app.appointment_date, app.reason,
        p.name as pet_name, p.status as pet_status,
        v.doctor_name, v.specialization, v.phone as vet_phone, v.clinic_address
      FROM Appointments app
      JOIN Pets p ON app.pet_id = p.pet_id
      JOIN Vets_Doctors v ON app.vet_id = v.vet_id
      ORDER BY app.appointment_date DESC
    `);
    res.json({ success: true, data: appointments });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/appointments', async (req: Request, res: Response) => {
  try {
    await getDb();
    const { pet_id, vet_id, appointment_date, reason } = req.body;
    if (!pet_id || !vet_id || !appointment_date) {
      return res.status(400).json({ success: false, error: 'Pet, Vet, and Appointment Date are required' });
    }

    const result = runQuery(
      'INSERT INTO Appointments (pet_id, vet_id, appointment_date, reason) VALUES (?, ?, ?, ?)',
      [pet_id, vet_id, appointment_date, reason || 'Routine Checkup']
    );
    res.json({ success: true, id: result.lastInsertRowid, message: 'Vet appointment scheduled successfully!' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// MEDICAL RECORDS
apiRouter.get('/medical-records', async (req: Request, res: Response) => {
  try {
    await getDb();
    const records = queryAll(`
      SELECT 
        mr.record_id, mr.pet_id, mr.diagnosis, mr.treatment_date, mr.vaccine_given,
        p.name as pet_name, p.age as pet_age, p.gender as pet_gender,
        b.breed_name, b.species
      FROM Medical_Records mr
      JOIN Pets p ON mr.pet_id = p.pet_id
      LEFT JOIN Breeds b ON p.breed_id = b.breed_id
      ORDER BY mr.treatment_date DESC
    `);
    res.json({ success: true, data: records });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/medical-records', async (req: Request, res: Response) => {
  try {
    await getDb();
    const { pet_id, diagnosis, treatment_date, vaccine_given, update_pet_status } = req.body;
    if (!pet_id || !diagnosis || !treatment_date) {
      return res.status(400).json({ success: false, error: 'Pet, Diagnosis, and Treatment Date are required' });
    }

    const result = runQuery(
      'INSERT INTO Medical_Records (pet_id, diagnosis, treatment_date, vaccine_given) VALUES (?, ?, ?, ?)',
      [pet_id, diagnosis, treatment_date, vaccine_given || null]
    );

    if (update_pet_status) {
      runQuery('UPDATE Pets SET status = ? WHERE pet_id = ?', [update_pet_status, pet_id]);
    }

    res.json({ success: true, id: result.lastInsertRowid, message: 'Medical & Vaccine record saved successfully!' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PRODUCTS & LOGISTICS
apiRouter.get('/products', async (req: Request, res: Response) => {
  try {
    await getDb();
    const products = queryAll(`
      SELECT 
        p.product_id, p.product_name, p.price, p.stock_quantity, p.category_id,
        c.category_name,
        CASE 
          WHEN p.stock_quantity = 0 THEN 'Out of Stock'
          WHEN p.stock_quantity <= 5 THEN 'Low Stock'
          ELSE 'In Stock'
        END as stock_status
      FROM Pet_Products p
      LEFT JOIN Product_Categories c ON p.category_id = c.category_id
      ORDER BY p.product_id DESC
    `);
    res.json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ATOMIC ORDER CHECKOUT WITH INVENTORY DECREMENT
apiRouter.get('/orders', async (req: Request, res: Response) => {
  try {
    await getDb();
    const orders = queryAll(`
      SELECT 
        o.order_id, o.user_id, o.order_date, o.total_amount,
        u.name as customer_name, u.email as customer_email, u.phone as customer_phone
      FROM Orders o
      JOIN Users u ON o.user_id = u.user_id
      ORDER BY o.order_date DESC
    `);

    const allItems = queryAll(`
      SELECT 
        oi.order_id, oi.product_id, oi.quantity, oi.price,
        p.product_name, c.category_name
      FROM Order_Items oi
      JOIN Pet_Products p ON oi.product_id = p.product_id
      LEFT JOIN Product_Categories c ON p.category_id = c.category_id
    `);

    const itemsByOrder: Record<number, any[]> = {};
    allItems.forEach((item: any) => {
      if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
      itemsByOrder[item.order_id].push(item);
    });

    const enrichedOrders = orders.map((ord: any) => ({
      ...ord,
      items: itemsByOrder[ord.order_id] || []
    }));

    res.json({ success: true, data: enrichedOrders });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/orders/checkout', async (req: Request, res: Response) => {
  try {
    const database = await getDb();
    const { user_id, items } = req.body; // items: Array<{ product_id: number, quantity: number }>

    if (!user_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'User ID and at least one item required' });
    }

    // Verify stock and compute total
    let totalAmount = 0;
    const validatedItems: Array<{ product_id: number; quantity: number; price: number; name: string }> = [];

    for (const item of items) {
      const product = queryAll('SELECT * FROM Pet_Products WHERE product_id = ?', [item.product_id])[0];
      if (!product) {
        return res.status(404).json({ success: false, error: `Product ID ${item.product_id} not found` });
      }
      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          error: `Insufficient stock for '${product.product_name}'. Available: ${product.stock_quantity}, Requested: ${item.quantity}` 
        });
      }
      const itemPrice = parseFloat(product.price);
      totalAmount += itemPrice * item.quantity;
      validatedItems.push({
        product_id: product.product_id,
        quantity: item.quantity,
        price: itemPrice,
        name: product.product_name
      });
    }

    const orderDate = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Insert Order
    const orderResult = runQuery(
      'INSERT INTO Orders (user_id, order_date, total_amount) VALUES (?, ?, ?)',
      [user_id, orderDate, totalAmount]
    );
    const orderId = orderResult.lastInsertRowid;

    // Insert Order Items and decrement stock
    for (const vItem of validatedItems) {
      runQuery(
        'INSERT INTO Order_Items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, vItem.product_id, vItem.quantity, vItem.price]
      );
      runQuery(
        'UPDATE Pet_Products SET stock_quantity = stock_quantity - ? WHERE product_id = ?',
        [vItem.quantity, vItem.product_id]
      );
    }

    persistDb();

    res.json({
      success: true,
      order_id: orderId,
      total_amount: totalAmount,
      message: `Order #${orderId} processed successfully! Inventory auto-deducted.`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DONATIONS
apiRouter.get('/donations', async (req: Request, res: Response) => {
  try {
    await getDb();
    const donations = queryAll(`
      SELECT 
        d.donation_id, d.user_id, d.amount, d.donation_date, d.payment_method,
        COALESCE(u.name, 'Anonymous Donor') as donor_name,
        u.email as donor_email, u.phone as donor_phone
      FROM Donations d
      LEFT JOIN Users u ON d.user_id = u.user_id
      ORDER BY d.donation_date DESC, d.donation_id DESC
    `);
    res.json({ success: true, data: donations });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/donations', async (req: Request, res: Response) => {
  try {
    await getDb();
    const { user_id, amount, donation_date, payment_method = 'bKash' } = req.body;
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid donation amount is required' });
    }

    const date = donation_date || new Date().toISOString().split('T')[0];
    const result = runQuery(
      'INSERT INTO Donations (user_id, amount, donation_date, payment_method) VALUES (?, ?, ?, ?)',
      [user_id ? parseInt(user_id) : null, parseFloat(amount), date, payment_method]
    );

    // If user specified, update their user_type to 'Donor' if they were 'General'
    if (user_id) {
      runQuery("UPDATE Users SET user_type = 'Donor' WHERE user_id = ? AND user_type = 'General'", [user_id]);
    }

    res.json({ success: true, id: result.lastInsertRowid, message: 'Donation recorded with deepest gratitude!' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// USERS DIRECTORY
apiRouter.get('/users', async (req: Request, res: Response) => {
  try {
    await getDb();
    const users = queryAll(`
      SELECT 
        u.user_id, u.name, u.email, u.phone, u.user_type, u.address,
        (SELECT COUNT(*) FROM Adoptions a WHERE a.user_id = u.user_id) as adoption_count,
        (SELECT COUNT(*) FROM Orders o WHERE o.user_id = u.user_id) as order_count,
        (SELECT COALESCE(SUM(amount), 0) FROM Donations d WHERE d.user_id = u.user_id) as total_donated
      FROM Users u
      ORDER BY u.user_id ASC
    `);
    res.json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// BREEDS & SPECIES
apiRouter.get('/breeds', async (req: Request, res: Response) => {
  try {
    await getDb();
    const breeds = queryAll(`
      SELECT 
        b.breed_id, b.breed_name, b.species,
        COUNT(p.pet_id) as pet_count
      FROM Breeds b
      LEFT JOIN Pets p ON b.breed_id = p.breed_id
      GROUP BY b.breed_id, b.breed_name, b.species
      ORDER BY b.species ASC, b.breed_name ASC
    `);
    res.json({ success: true, data: breeds });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// VETS & DOCTORS
apiRouter.get('/vets', async (req: Request, res: Response) => {
  try {
    await getDb();
    const vets = queryAll(`
      SELECT 
        v.vet_id, v.doctor_name, v.specialization, v.phone, v.clinic_address,
        COUNT(app.appointment_id) as appointment_count
      FROM Vets_Doctors v
      LEFT JOIN Appointments app ON v.vet_id = app.vet_id
      GROUP BY v.vet_id, v.doctor_name, v.specialization, v.phone, v.clinic_address
      ORDER BY v.vet_id ASC
    `);
    res.json({ success: true, data: vets });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CATEGORIES
apiRouter.get('/categories', async (req: Request, res: Response) => {
  try {
    await getDb();
    const categories = queryAll(`
      SELECT 
        c.category_id, c.category_name,
        COUNT(p.product_id) as product_count
      FROM Product_Categories c
      LEFT JOIN Pet_Products p ON c.category_id = p.category_id
      GROUP BY c.category_id, c.category_name
      ORDER BY c.category_id ASC
    `);
    res.json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
