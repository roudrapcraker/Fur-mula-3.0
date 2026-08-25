import fs from 'fs';
import path from 'path';
import initSqlJs, { Database } from 'sql.js';

let db: Database | null = null;
const DB_FILE = path.join(process.cwd(), 'furmula3.db');

export const INITIAL_SCHEMA = `
PRAGMA foreign_keys = ON;

-- Users Table
CREATE TABLE IF NOT EXISTS Users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    user_type VARCHAR(20) DEFAULT 'General' CHECK(user_type IN ('Adopter', 'Donor', 'General')),
    address TEXT
);

-- Breeds Table
CREATE TABLE IF NOT EXISTS Breeds (
    breed_id INTEGER PRIMARY KEY AUTOINCREMENT,
    breed_name VARCHAR(50) NOT NULL,
    species VARCHAR(30) NOT NULL
);

-- Pets Table
CREATE TABLE IF NOT EXISTS Pets (
    pet_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    age DECIMAL(4,2),
    gender VARCHAR(10),
    status VARCHAR(20) DEFAULT 'Available' CHECK(status IN ('Available', 'Adopted', 'Under Treatment')),
    breed_id INTEGER,
    FOREIGN KEY (breed_id) REFERENCES Breeds(breed_id) ON DELETE SET NULL
);

-- Adoptions Table
CREATE TABLE IF NOT EXISTS Adoptions (
    adoption_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    pet_id INTEGER NOT NULL,
    adoption_date DATE NOT NULL,
    application_status VARCHAR(20) DEFAULT 'Pending' CHECK(application_status IN ('Pending', 'Approved', 'Rejected')),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (pet_id) REFERENCES Pets(pet_id) ON DELETE CASCADE
);

-- Vets_Doctors Table
CREATE TABLE IF NOT EXISTS Vets_Doctors (
    vet_id INTEGER PRIMARY KEY AUTOINCREMENT,
    doctor_name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100),
    phone VARCHAR(20),
    clinic_address TEXT
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS Appointments (
    appointment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL,
    vet_id INTEGER NOT NULL,
    appointment_date DATETIME NOT NULL,
    reason VARCHAR(255),
    FOREIGN KEY (pet_id) REFERENCES Pets(pet_id) ON DELETE CASCADE,
    FOREIGN KEY (vet_id) REFERENCES Vets_Doctors(vet_id) ON DELETE CASCADE
);

-- Medical_Records Table
CREATE TABLE IF NOT EXISTS Medical_Records (
    record_id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL,
    diagnosis TEXT,
    treatment_date DATE NOT NULL,
    vaccine_given VARCHAR(100),
    FOREIGN KEY (pet_id) REFERENCES Pets(pet_id) ON DELETE CASCADE
);

-- Product_Categories Table
CREATE TABLE IF NOT EXISTS Product_Categories (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_name VARCHAR(50) NOT NULL
);

-- Pet_Products Table
CREATE TABLE IF NOT EXISTS Pet_Products (
    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INTEGER NOT NULL,
    category_id INTEGER,
    FOREIGN KEY (category_id) REFERENCES Product_Categories(category_id) ON DELETE SET NULL
);

-- Orders Table
CREATE TABLE IF NOT EXISTS Orders (
    order_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    order_date DATETIME NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- Order_Items Table
CREATE TABLE IF NOT EXISTS Order_Items (
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (order_id, product_id),
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Pet_Products(product_id) ON DELETE CASCADE
);

-- Donations Table
CREATE TABLE IF NOT EXISTS Donations (
    donation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount DECIMAL(10,2) NOT NULL,
    donation_date DATE NOT NULL,
    payment_method VARCHAR(30),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL
);
`;

export const INITIAL_SEED = `
INSERT OR IGNORE INTO Breeds (breed_id, breed_name, species) VALUES 
(1, 'Persian', 'Cat'),
(2, 'Siamese', 'Cat'),
(3, 'German Shepherd', 'Dog'),
(4, 'Golden Retriever', 'Dog'),
(5, 'Local Mix', 'Cat');

INSERT OR IGNORE INTO Users (user_id, name, email, phone, user_type, address) VALUES 
(1, 'Asif Talukder', 'asif@gmail.com', '01711111111', 'Adopter', 'Dhanmondi, Dhaka'),
(2, 'Tanvir Ahmed', 'tanvir@gmail.com', '01822222222', 'Donor', 'Uttara, Dhaka'),
(3, 'Nusrat Jahan', 'nusrat@gmail.com', '01933333333', 'Adopter', 'Gulshan, Dhaka'),
(4, 'Rahim Uddin', 'rahim@gmail.com', '01644444444', 'General', 'Mirpur, Dhaka');

INSERT OR IGNORE INTO Pets (pet_id, name, age, gender, status, breed_id) VALUES 
(1, 'Piu', 0.58, 'Female', 'Available', 1),
(2, 'Milo', 2.00, 'Male', 'Available', 1),
(3, 'Luna', 1.00, 'Female', 'Adopted', 2),
(4, 'Rocky', 3.00, 'Male', 'Available', 3),
(5, 'Bella', 2.00, 'Female', 'Under Treatment', 4),
(6, 'Felix', 1.00, 'Male', 'Available', 5);

INSERT OR IGNORE INTO Adoptions (adoption_id, user_id, pet_id, adoption_date, application_status) VALUES 
(1, 1, 3, '2026-07-15', 'Approved'),
(2, 3, 1, '2026-08-01', 'Pending');

INSERT OR IGNORE INTO Vets_Doctors (vet_id, doctor_name, specialization, phone, clinic_address) VALUES 
(1, 'Dr. Ayesha Khan', 'Veterinary Surgeon', '01555555555', 'Pet Life Clinic, Banani'),
(2, 'Dr. Mahmud Hassan', 'Feline Specialist', '01366666666', 'Care Paws Hospital, Dhanmondi');

INSERT OR IGNORE INTO Appointments (appointment_id, pet_id, vet_id, appointment_date, reason) VALUES 
(1, 1, 2, '2026-08-05 11:00:00', 'First Kitten Health Checkup'),
(2, 5, 1, '2026-08-10 10:30:00', 'General Physical Checkup & Fever');

INSERT OR IGNORE INTO Medical_Records (record_id, pet_id, diagnosis, treatment_date, vaccine_given) VALUES 
(1, 1, 'Healthy Kitten, Normal Weight', '2026-08-05', 'Tricat Trio Vaccine'),
(2, 3, 'Healthy and Active', '2026-07-10', 'Rabies Vaccine');

INSERT OR IGNORE INTO Product_Categories (category_id, category_name) VALUES 
(1, 'Pet Food'),
(2, 'Toys & Accessories'),
(3, 'Healthcare & Medicines');

INSERT OR IGNORE INTO Pet_Products (product_id, product_name, price, stock_quantity, category_id) VALUES 
(1, 'Whiskas Kitten Food 1kg', 700.00, 20, 1),
(2, 'Drools Dog Food 3kg', 1200.00, 15, 1),
(3, 'Interactive Cat Toy Ball', 350.00, 5, 2),
(4, 'Flea & Tick Shampoo', 450.00, 8, 3);

INSERT OR IGNORE INTO Orders (order_id, user_id, order_date, total_amount) VALUES 
(1, 1, '2026-08-01 11:20:00', 1050.00),
(2, 3, '2026-08-03 16:45:00', 1200.00);

INSERT OR IGNORE INTO Order_Items (order_id, product_id, quantity, price) VALUES 
(1, 1, 1, 700.00),
(1, 3, 1, 350.00),
(2, 2, 1, 1200.00);

INSERT OR IGNORE INTO Donations (donation_id, user_id, amount, donation_date, payment_method) VALUES 
(1, 2, 5000.00, '2026-07-20', 'bKash'),
(2, 4, 2000.00, '2026-08-02', 'Credit Card');
`;

export async function getDb(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();
  if (fs.existsSync(DB_FILE)) {
    try {
      const buffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(buffer);
      db.run('PRAGMA foreign_keys = ON;');
      return db;
    } catch (e) {
      console.error('Failed to load existing db, initializing new one:', e);
    }
  }

  db = new SQL.Database();
  db.run(INITIAL_SCHEMA);
  db.run(INITIAL_SEED);
  persistDb();
  return db;
}

export function persistDb(): void {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Error saving database to file:', err);
  }
}

export function resetDatabase(): void {
  if (!db) return;
  // Drop all tables
  const tables = [
    'Order_Items', 'Orders', 'Donations', 'Medical_Records',
    'Appointments', 'Adoptions', 'Pets', 'Pet_Products',
    'Product_Categories', 'Vets_Doctors', 'Breeds', 'Users'
  ];
  db.run('PRAGMA foreign_keys = OFF;');
  for (const t of tables) {
    try {
      db.run(`DROP TABLE IF EXISTS ${t};`);
    } catch {}
  }
  db.run(INITIAL_SCHEMA);
  db.run(INITIAL_SEED);
  db.run('PRAGMA foreign_keys = ON;');
  persistDb();
}

export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  if (!db) throw new Error('DB not initialized');
  const stmt = db.prepare(sql);
  if (params && params.length > 0) {
    stmt.bind(params);
  }
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

export function runQuery(sql: string, params: any[] = []): { lastInsertRowid: number; changes: number } {
  if (!db) throw new Error('DB not initialized');
  db.run(sql, params);
  const info = queryAll<{ id: number }>('SELECT last_insert_rowid() as id')[0];
  const changesInfo = queryAll<{ changes: number }>('SELECT changes() as changes')[0];
  persistDb();
  return {
    lastInsertRowid: info ? info.id : 0,
    changes: changesInfo ? changesInfo.changes : 0
  };
}
