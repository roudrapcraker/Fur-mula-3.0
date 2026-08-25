import React from 'react';
import { 
  Database, 
  PawPrint, 
  Stethoscope, 
  ShoppingBag, 
  HeartHandshake, 
  Users, 
  Terminal, 
  Table, 
  RotateCcw, 
  Download,
  AlertTriangle,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export type NavTab = 
  | 'dashboard' 
  | 'pets' 
  | 'vet' 
  | 'store' 
  | 'donations' 
  | 'users' 
  | 'sql' 
  | 'tables';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  lowStockCount?: number;
  pendingAdoptionsCount?: number;
  onRefresh: () => void;
  refreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  lowStockCount = 0,
  pendingAdoptionsCount = 0,
  onRefresh,
  refreshing = false,
}) => {
  const tabs = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: PawPrint },
    { 
      id: 'pets' as NavTab, 
      label: 'Pets & Adoptions', 
      icon: Sparkles, 
      badge: pendingAdoptionsCount > 0 ? `${pendingAdoptionsCount} Pending` : undefined,
      badgeAlert: pendingAdoptionsCount > 0 
    },
    { id: 'vet' as NavTab, label: 'Vet Clinic & Care', icon: Stethoscope },
    { 
      id: 'store' as NavTab, 
      label: 'Store & Logistics', 
      icon: ShoppingBag, 
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : undefined, 
      badgeAlert: lowStockCount > 0 
    },
    { id: 'donations' as NavTab, label: 'Donations', icon: HeartHandshake },
    { id: 'users' as NavTab, label: 'Users & Roles', icon: Users },
    { id: 'sql' as NavTab, label: 'SQL Workbench', icon: Terminal, highlight: true },
    { id: 'tables' as NavTab, label: '12-Table Explorer', icon: Table },
  ];

  const handleResetDb = async () => {
    if (!window.confirm('Reset database back to the original 12-table seed data? Any new records will be restored to default demo state.')) return;
    try {
      await api.resetDatabase();
      alert('Database reset to original seed data successfully!');
      onRefresh();
    } catch (err: any) {
      alert('Failed to reset database: ' + err.message);
    }
  };

  return (
    <header className="bg-stone-900 text-stone-100 border-b border-stone-800 sticky top-0 z-40 shadow-sm">
      {/* Top Banner with branding & quick tools */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center shadow-inner text-stone-950 font-black">
              <PawPrint className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-stone-100">Fur-mula 3.0</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-950 text-amber-300 border border-amber-800">
                  12-Table DBMS
                </span>
              </div>
              <p className="text-xs text-stone-400 hidden sm:block">Pet Adoption, Care & Logistics Management System</p>
            </div>
          </div>

          {/* Quick Global Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={refreshing}
              id="nav-refresh-btn"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-medium border border-stone-700 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh database records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <a
              href="/api/db/export-sql"
              download="furmula3_backup.sql"
              id="nav-export-sql-btn"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-medium border border-stone-700 transition-colors cursor-pointer"
              title="Download full SQL backup"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export SQL Dump</span>
            </a>

            <button
              onClick={handleResetDb}
              id="nav-reset-db-btn"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-rose-950 hover:border-rose-800 hover:text-rose-300 text-stone-300 text-xs font-medium border border-stone-700 transition-colors cursor-pointer"
              title="Reset database to original seed state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Seed</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-stone-950/80 backdrop-blur-md border-t border-stone-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-nav-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : tab.highlight
                      ? 'text-amber-400 hover:bg-stone-800/80 border border-amber-500/20'
                      : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : tab.highlight ? 'text-amber-400' : 'text-stone-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        tab.badgeAlert 
                          ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50 animate-pulse' 
                          : 'bg-stone-800 text-emerald-400'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
