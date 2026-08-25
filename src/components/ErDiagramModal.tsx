import React from 'react';
import { TableSchema } from '../types';
import { Key, ArrowRight, X, Database } from 'lucide-react';

interface ErDiagramModalProps {
  schemas: TableSchema[];
  onClose: () => void;
}

export const ErDiagramModal: React.FC<ErDiagramModalProps> = ({ schemas, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-100">
                Fur-mula 3.0 Entity-Relationship (ER) Schema Map
              </h3>
              <p className="text-xs text-stone-400">
                Complete relational mapping across all 12 database tables, Primary Keys (PK), and Foreign Key (FK) constraints.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ER Diagram Grid */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {schemas.map((table) => {
              return (
                <div
                  key={table.name}
                  className="bg-stone-950 border border-stone-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
                >
                  {/* Table title */}
                  <div className="p-3 bg-stone-900 border-b border-stone-800 flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-emerald-400">{table.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-800 text-stone-400 font-mono">
                      {table.rowCount} Rows
                    </span>
                  </div>

                  {/* Columns list */}
                  <div className="p-3 space-y-1 text-[11px] font-mono flex-1">
                    {table.columns.map((col) => {
                      const isFk = table.foreignKeys.some((fk) => fk.from === col.name);
                      const fkInfo = table.foreignKeys.find((fk) => fk.from === col.name);

                      return (
                        <div
                          key={col.name}
                          className="flex items-center justify-between py-1 border-b border-stone-900/60 last:border-none"
                        >
                          <div className="flex items-center gap-1.5">
                            {col.pk ? (
                              <span className="text-amber-400 flex items-center gap-0.5 font-bold" title="Primary Key">
                                <Key className="w-3 h-3" />
                                {col.name}
                              </span>
                            ) : isFk ? (
                              <span className="text-blue-400 flex items-center gap-0.5 font-semibold" title={`FK -> ${fkInfo?.table}.${fkInfo?.to}`}>
                                🔗 {col.name}
                              </span>
                            ) : (
                              <span className="text-stone-300">{col.name}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-stone-500">{col.type}</span>
                            {col.pk && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950 text-amber-300 font-bold border border-amber-800">
                                PK
                              </span>
                            )}
                            {isFk && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-blue-950 text-blue-300 font-bold border border-blue-800">
                                FK
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Foreign Key Reference summary footer */}
                  {table.foreignKeys.length > 0 && (
                    <div className="p-2.5 bg-stone-900/80 border-t border-stone-800/80 text-[10px] text-stone-400 space-y-1">
                      <span className="font-semibold text-stone-300 block">Foreign Key Links:</span>
                      {table.foreignKeys.map((fk, idx) => (
                        <div key={idx} className="flex items-center gap-1 text-blue-400 font-mono">
                          <span>{fk.from}</span>
                          <ArrowRight className="w-3 h-3 text-stone-500" />
                          <span className="text-emerald-400 font-bold">{fk.table}({fk.to})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
