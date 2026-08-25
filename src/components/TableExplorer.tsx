import React, { useState, useEffect } from 'react';
import { 
  Table as TableIcon, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Download, 
  Eye, 
  Key, 
  Layers, 
  RefreshCw, 
  Database,
  ArrowRight,
  Filter
} from 'lucide-react';
import { TableSchema } from '../types';
import { api } from '../services/api';
import { ErDiagramModal } from './ErDiagramModal';

const ALL_12_TABLES = [
  'Users', 'Breeds', 'Pets', 'Adoptions', 'Vets_Doctors', 
  'Appointments', 'Medical_Records', 'Product_Categories', 
  'Pet_Products', 'Orders', 'Order_Items', 'Donations'
];

export const TableExplorer: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<string>('Pets');
  const [schemas, setSchemas] = useState<TableSchema[]>([]);
  const [tableData, setTableData] = useState<{ columns: any[]; rows: any[]; total: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showErModal, setShowErModal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Row Add/Edit Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [rowFormData, setRowFormData] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  // Load schemas on mount
  useEffect(() => {
    loadSchemas();
  }, []);

  // Load table data when selectedTable changes
  useEffect(() => {
    loadTableData(selectedTable);
  }, [selectedTable]);

  const loadSchemas = async () => {
    try {
      const data = await api.getDbSchema();
      setSchemas(data);
    } catch (err: any) {
      console.error('Failed to load schemas:', err);
    }
  };

  const loadTableData = async (tableName: string) => {
    setLoading(true);
    setFeedback(null);
    try {
      const data = await api.getTableData(tableName);
      setTableData(data);
      // reload schema count
      loadSchemas();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const currentSchema = schemas.find(s => s.name === selectedTable);
  const pkColumn = currentSchema?.columns.find(c => c.pk)?.name || currentSchema?.columns[0]?.name || 'id';

  // Filtered rows
  const filteredRows = tableData?.rows.filter((row: any) => {
    if (!searchTerm.trim()) return true;
    return Object.values(row).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) || [];

  // Handle Save Row
  const handleSaveRow = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingRow) {
        const pkVal = editingRow[pkColumn];
        await api.updateTableRow(selectedTable, pkColumn, pkVal, rowFormData);
        setFeedback({ type: 'success', message: `Row in ${selectedTable} updated successfully!` });
      } else {
        await api.insertTableRow(selectedTable, rowFormData);
        setFeedback({ type: 'success', message: `New row inserted into ${selectedTable}!` });
      }
      setShowAddModal(false);
      setEditingRow(null);
      setRowFormData({});
      loadTableData(selectedTable);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Row
  const handleDeleteRow = async (row: any) => {
    const pkVal = row[pkColumn];
    if (!window.confirm(`Delete record with ${pkColumn} = ${pkVal} from table ${selectedTable}?`)) return;
    try {
      await api.deleteTableRow(selectedTable, pkColumn, pkVal);
      setFeedback({ type: 'success', message: `Record deleted from ${selectedTable}.` });
      loadTableData(selectedTable);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const openAddModal = () => {
    setEditingRow(null);
    setRowFormData({});
    setShowAddModal(true);
  };

  const openEditModal = (row: any) => {
    setEditingRow(row);
    setRowFormData({ ...row });
    setShowAddModal(true);
  };

  const handleExportCsv = () => {
    if (!tableData?.rows || tableData.rows.length === 0) return;
    const cols = tableData.columns.map(c => c.name);
    const csvRows = [
      cols.join(','),
      ...tableData.rows.map(row => 
        cols.map(c => {
          const val = row[c];
          if (val === null || val === undefined) return '';
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTable}_table_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Feedback banner */}
      {feedback && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
          feedback.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200' 
            : 'bg-rose-950/80 border-rose-700 text-rose-200'
        }`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-stone-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-stone-100 flex items-center gap-2">
                <TableIcon className="w-5 h-5 text-emerald-400" />
                12-Table Relational Schema & Data Explorer
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-medium">
                Direct DBMS CRUD Engine
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Inspect raw table structures, verify primary & foreign keys, execute row mutations, and visualize ER diagrams.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowErModal(true)}
              className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-emerald-400 text-xs font-semibold border border-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              View ER Diagram
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>

            <button
              onClick={openAddModal}
              id="explorer-insert-row-btn"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Insert Row
            </button>
          </div>
        </div>

        {/* 12-Table Selector Pills */}
        <div className="mt-6 pt-4 border-t border-stone-800">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-2">
            Select Database Table (12 Relational Tables):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {ALL_12_TABLES.map((tName) => {
              const s = schemas.find((x) => x.name === tName);
              const isActive = selectedTable === tName;

              return (
                <button
                  key={tName}
                  onClick={() => setSelectedTable(tName)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white font-bold shadow-sm'
                      : 'bg-stone-950 hover:bg-stone-800 text-stone-300 border border-stone-800'
                  }`}
                >
                  <span>{tName}</span>
                  {s && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-stone-850 text-stone-500'
                    }`}>
                      {s.rowCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Table Info & Search */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-sm">
        {/* Table top bar */}
        <div className="p-4 bg-stone-850 border-b border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="font-mono font-extrabold text-sm text-stone-100 flex items-center gap-2">
              <span className="text-emerald-400">TABLE</span> {selectedTable}
            </div>
            {currentSchema && (
              <span className="text-xs text-stone-400 font-mono">
                ({currentSchema.columns.length} columns, {currentSchema.rowCount} rows)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Search in ${selectedTable}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              onClick={() => loadTableData(selectedTable)}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Data Grid */}
        {loading ? (
          <div className="p-12 text-center text-stone-500 text-xs">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading {selectedTable} records...
          </div>
        ) : tableData && tableData.columns.length > 0 ? (
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs text-stone-300 font-mono">
              <thead className="bg-stone-950 text-stone-400 uppercase tracking-wider text-[10px] font-bold border-b border-stone-800 sticky top-0">
                <tr>
                  {tableData.columns.map((col: any) => {
                    const isFk = currentSchema?.foreignKeys.some(fk => fk.from === col.name);
                    return (
                      <th key={col.name} className="px-4 py-3 whitespace-nowrap bg-stone-950">
                        <div className="flex items-center gap-1">
                          {col.pk > 0 ? (
                            <span className="text-amber-400 flex items-center gap-0.5">
                              <Key className="w-3 h-3" /> {col.name}
                            </span>
                          ) : isFk ? (
                            <span className="text-blue-400">🔗 {col.name}</span>
                          ) : (
                            col.name
                          )}
                          <span className="text-[9px] text-stone-600 font-normal">({col.type})</span>
                        </div>
                      </th>
                    );
                  })}
                  <th className="px-4 py-3 text-right whitespace-nowrap bg-stone-950">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/80">
                {filteredRows.map((row: any, rIdx: number) => (
                  <tr key={rIdx} className="hover:bg-stone-850/60 transition-colors">
                    {tableData.columns.map((col: any) => (
                      <td key={col.name} className="px-4 py-2.5 whitespace-nowrap">
                        {row[col.name] === null ? (
                          <span className="text-stone-600 italic">NULL</span>
                        ) : (
                          String(row[col.name])
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(row)}
                          className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer"
                          title="Edit Row"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRow(row)}
                          className="p-1 rounded bg-stone-800 hover:bg-rose-950 hover:text-rose-400 text-stone-400 cursor-pointer"
                          title="Delete Row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-stone-500 text-xs">
            No rows found in table {selectedTable}.
          </div>
        )}
      </div>

      {/* INSERT / EDIT ROW DYNAMIC MODAL */}
      {showAddModal && currentSchema && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-extrabold text-base text-stone-100 font-mono">
                {editingRow ? `UPDATE ${selectedTable}` : `INSERT INTO ${selectedTable}`}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveRow} className="space-y-3.5 text-xs">
              {currentSchema.columns.map((col) => {
                // If inserting and column is primary key with AUTOINCREMENT, allow leaving empty or auto
                const isAutoPk = col.pk && !editingRow;

                return (
                  <div key={col.name}>
                    <label className="block text-stone-300 font-mono font-medium mb-1">
                      {col.name} <span className="text-stone-500 text-[10px]">({col.type}{col.pk ? ' - PRIMARY KEY' : ''})</span>
                    </label>
                    <input
                      type="text"
                      disabled={col.pk && Boolean(editingRow)}
                      placeholder={isAutoPk ? '(Auto Generated if left blank)' : `Enter ${col.name}`}
                      value={rowFormData[col.name] !== undefined ? rowFormData[col.name] : ''}
                      onChange={(e) => setRowFormData({ ...rowFormData, [col.name]: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    />
                  </div>
                );
              })}

              <div className="pt-3 border-t border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Executing SQL...' : editingRow ? 'Update Record' : 'Insert Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ER DIAGRAM MODAL */}
      {showErModal && (
        <ErDiagramModal schemas={schemas} onClose={() => setShowErModal(false)} />
      )}
    </div>
  );
};
