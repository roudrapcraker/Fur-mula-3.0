import React, { useState } from 'react';
import { 
  Terminal, 
  Play, 
  RotateCcw, 
  Download, 
  Copy, 
  Check, 
  Clock, 
  Database, 
  Layers, 
  HelpCircle,
  AlertTriangle,
  FileCode,
  Table as TableIcon
} from 'lucide-react';
import { api } from '../services/api';

const SAMPLE_QUERIES = [
  {
    title: '1. Pet Adoption Journey (4-Table JOIN)',
    category: 'JOIN Operations',
    description: 'Combines Pets, Breeds, Adoptions, and Users to inspect full adoption history.',
    sql: `SELECT 
    p.pet_id,
    p.name AS pet_name,
    b.breed_name,
    b.species,
    a.application_status,
    a.adoption_date,
    u.name AS adopter_name,
    u.email AS adopter_email,
    u.phone AS adopter_phone
FROM Pets p
JOIN Breeds b ON p.breed_id = b.breed_id
JOIN Adoptions a ON p.pet_id = a.pet_id
JOIN Users u ON a.user_id = u.user_id
ORDER BY a.adoption_date DESC;`
  },
  {
    title: '2. Multi-Table Financial Aggregate (Donations + Store Orders)',
    category: 'Aggregations',
    description: 'Calculates total financial revenue for the shelter across both community donations and store sales.',
    sql: `SELECT 
    'Community Donations' AS revenue_source,
    COUNT(donation_id) AS total_transactions,
    SUM(amount) AS total_amount_bdt
FROM Donations
UNION ALL
SELECT 
    'Pet Care Store Orders' AS revenue_source,
    COUNT(order_id) AS total_transactions,
    SUM(total_amount) AS total_amount_bdt
FROM Orders;`
  },
  {
    title: '3. Generous Users: Adopters Who Also Donated (Nested Subquery)',
    category: 'Sub-queries',
    description: 'Finds users who have adopted an animal and also contributed financial donations.',
    sql: `SELECT 
    u.user_id,
    u.name,
    u.email,
    u.user_type,
    (SELECT COUNT(*) FROM Adoptions a WHERE a.user_id = u.user_id AND a.application_status = 'Approved') AS adopted_pets_count,
    (SELECT SUM(d.amount) FROM Donations d WHERE d.user_id = u.user_id) AS total_donated_bdt
FROM Users u
WHERE u.user_id IN (SELECT DISTINCT user_id FROM Adoptions WHERE application_status = 'Approved')
  AND u.user_id IN (SELECT DISTINCT user_id FROM Donations);`
  },
  {
    title: '4. Inventory Restock Alert (≤ 5 units)',
    category: 'Business Logic & Filters',
    description: 'Lists all pet food, toys, and medicine items that require immediate reordering with category details.',
    sql: `SELECT 
    p.product_id,
    p.product_name,
    c.category_name,
    p.price,
    p.stock_quantity,
    CASE 
        WHEN p.stock_quantity = 0 THEN 'CRITICAL: Out of Stock'
        ELSE 'WARNING: Low Stock'
    END AS stock_alert
FROM Pet_Products p
LEFT JOIN Product_Categories c ON p.category_id = c.category_id
WHERE p.stock_quantity <= 5
ORDER BY p.stock_quantity ASC;`
  },
  {
    title: '5. Detailed Multi-Item Orders with Product Line Items',
    category: 'JOIN Operations',
    description: 'Breaks down every customer order into individual items, prices, and quantities.',
    sql: `SELECT 
    o.order_id,
    o.order_date,
    u.name AS customer_name,
    p.product_name,
    oi.quantity,
    oi.price AS unit_price,
    (oi.quantity * oi.price) AS line_total,
    o.total_amount AS order_grand_total
FROM Orders o
JOIN Users u ON o.user_id = u.user_id
JOIN Order_Items oi ON o.order_id = oi.order_id
JOIN Pet_Products p ON oi.product_id = p.product_id
ORDER BY o.order_id ASC, p.product_name ASC;`
  },
  {
    title: '6. Veterinary Clinic Workload & Appointments',
    category: 'Aggregations',
    description: 'Analyzes appointment count and distinct patients handled per veterinary doctor.',
    sql: `SELECT 
    v.vet_id,
    v.doctor_name,
    v.specialization,
    v.clinic_address,
    COUNT(app.appointment_id) AS total_appointments_booked,
    COUNT(DISTINCT app.pet_id) AS distinct_pets_treated
FROM Vets_Doctors v
LEFT JOIN Appointments app ON v.vet_id = app.vet_id
GROUP BY v.vet_id, v.doctor_name, v.specialization, v.clinic_address
ORDER BY total_appointments_booked DESC;`
  },
  {
    title: '7. Medical History & Vaccine Tracker with Pet Demographics',
    category: 'JOIN Operations',
    description: 'Comprehensive medical records linked with pet species, breed, and gender.',
    sql: `SELECT 
    mr.record_id,
    mr.treatment_date,
    p.name AS pet_name,
    b.species,
    b.breed_name,
    mr.diagnosis,
    COALESCE(mr.vaccine_given, 'None') AS vaccine_administered
FROM Medical_Records mr
JOIN Pets p ON mr.pet_id = p.pet_id
JOIN Breeds b ON p.breed_id = b.breed_id
ORDER BY mr.treatment_date DESC;`
  },
  {
    title: '8. Adoption Rate by Pet Breed & Species (Aggregated)',
    category: 'Aggregations',
    description: 'Calculates the percentage of pets adopted for each breed in the shelter.',
    sql: `SELECT 
    b.species,
    b.breed_name,
    COUNT(p.pet_id) AS total_pets,
    SUM(CASE WHEN p.status = 'Adopted' THEN 1 ELSE 0 END) AS adopted_count,
    ROUND(
        (CAST(SUM(CASE WHEN p.status = 'Adopted' THEN 1 ELSE 0 END) AS FLOAT) / 
         NULLIF(COUNT(p.pet_id), 0)) * 100, 
        1
    ) AS adoption_success_pct
FROM Breeds b
LEFT JOIN Pets p ON b.breed_id = p.breed_id
GROUP BY b.breed_id, b.species, b.breed_name
ORDER BY total_pets DESC;`
  }
];

export const SqlWorkbench: React.FC = () => {
  const [sqlQuery, setSqlQuery] = useState<string>(SAMPLE_QUERIES[0].sql);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRunQuery = async () => {
    if (!sqlQuery.trim()) return;
    setExecuting(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.executeSql(sqlQuery);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to execute query');
    } finally {
      setExecuting(false);
    }
  };

  const handleSelectSample = (sql: string) => {
    setSqlQuery(sql);
    setError(null);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlQuery);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    if (!result?.rows || result.rows.length === 0) return;
    const columns = result.columns || Object.keys(result.rows[0]);
    const csvRows = [
      columns.join(','),
      ...result.rows.map((row: any) =>
        columns
          .map((col: string) => {
            const val = row[col];
            if (val === null || val === undefined) return '';
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(',')
      )
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_result_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-stone-100 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-amber-400" />
                Interactive SQL Console & Query Workbench
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-medium">
                Live SQLite Relational Engine
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Execute raw SQL DQL (SELECT, JOIN, nested sub-queries) and DML/DDL commands directly across all 12 tables.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySql}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold border border-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy SQL'}
            </button>

            <button
              onClick={() => setSqlQuery('SELECT * FROM Pets;')}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold border border-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear
            </button>

            <button
              onClick={handleRunQuery}
              disabled={executing || !sqlQuery.trim()}
              id="execute-sql-btn"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              {executing ? 'Executing...' : 'Run Query (Ctrl+Enter)'}
            </button>
          </div>
        </div>
      </div>

      {/* Editor & Sample Queries Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SQL Editor Box */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-3 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
              <span className="text-xs font-mono text-amber-400 font-semibold flex items-center gap-1.5">
                <FileCode className="w-4 h-4" /> SQL Editor
              </span>
              <span className="text-[11px] text-stone-500">Supports JOINs, Subqueries, Unions, DDL & DML</span>
            </div>

            <div className="relative">
              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleRunQuery();
                  }
                }}
                rows={10}
                placeholder="Enter SQL statement here..."
                className="w-full bg-stone-950 p-4 font-mono text-xs text-emerald-300 leading-relaxed focus:outline-none resize-y border-none"
                spellCheck={false}
              />
            </div>

            <div className="p-2.5 bg-stone-950/80 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
              <span>Press <kbd className="px-1.5 py-0.5 bg-stone-800 rounded text-stone-300 font-mono text-[10px]">Ctrl+Enter</kbd> to run</span>
              {result && (
                <span className="font-mono text-emerald-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Executed in {result.executionTimeMs}ms
                </span>
              )}
            </div>
          </div>

          {/* Execution Error Banner */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-mono flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-rose-100">SQL Execution Error:</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Results Table View */}
          {result && (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-3.5 bg-stone-850 border-b border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-stone-100">
                    Query Results ({result.type === 'SELECT' ? `${result.rowCount} Rows` : `${result.changes} Affected Rows`})
                  </h3>
                </div>

                {result.type === 'SELECT' && result.rows && result.rows.length > 0 && (
                  <button
                    onClick={handleDownloadCsv}
                    className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1 border border-stone-700 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Export CSV
                  </button>
                )}
              </div>

              {result.type === 'SELECT' ? (
                result.rows && result.rows.length > 0 ? (
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left text-xs text-stone-300 font-mono">
                      <thead className="bg-stone-950 text-stone-400 uppercase tracking-wider text-[10px] font-bold border-b border-stone-800 sticky top-0">
                        <tr>
                          {result.columns.map((col: string) => (
                            <th key={col} className="px-4 py-2.5 whitespace-nowrap bg-stone-950">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-800/80">
                        {result.rows.map((row: any, rIdx: number) => (
                          <tr key={rIdx} className="hover:bg-stone-850/60 transition-colors">
                            {result.columns.map((col: string) => (
                              <td key={col} className="px-4 py-2 whitespace-nowrap">
                                {row[col] === null ? (
                                  <span className="text-stone-600 italic">NULL</span>
                                ) : (
                                  String(row[col])
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-stone-500 text-xs">
                    Query executed successfully. Returned 0 rows.
                  </div>
                )
              ) : (
                <div className="p-6 bg-stone-950/60 text-xs text-stone-300 space-y-1">
                  <div className="text-emerald-400 font-bold">{result.message}</div>
                  <div className="text-stone-400">Last Insert Row ID: {result.lastInsertRowid}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pre-packaged Sample Queries Library */}
        <div className="space-y-3">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-stone-100 mb-1 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-400" />
              Pre-built Complex DBMS Queries
            </h3>
            <p className="text-[11px] text-stone-400 mb-3">
              Click any query below to instantly load and execute real multi-table joins, nested subqueries, and aggregations.
            </p>

            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {SAMPLE_QUERIES.map((sample, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSample(sample.sql)}
                  className="p-3 rounded-xl bg-stone-950 border border-stone-800 hover:border-amber-500/50 cursor-pointer transition-all hover:bg-stone-900 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      {sample.category}
                    </span>
                    <span className="text-[10px] text-stone-500 group-hover:text-amber-300">Load ↵</span>
                  </div>
                  <h4 className="font-bold text-xs text-stone-200 mt-1">{sample.title}</h4>
                  <p className="text-[11px] text-stone-400 mt-0.5 line-clamp-2">{sample.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
