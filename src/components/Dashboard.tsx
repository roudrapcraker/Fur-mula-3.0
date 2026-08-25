import React from 'react';
import { 
  PawPrint, 
  Heart, 
  ShoppingBag, 
  DollarSign, 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Activity,
  FileText
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { DashboardStats } from '../types';
import { NavTab } from './Navbar';

interface DashboardProps {
  stats: DashboardStats | null;
  loading: boolean;
  onNavigate: (tab: NavTab) => void;
  onApproveAdoption?: (id: number) => void;
}

const COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];

export const Dashboard: React.FC<DashboardProps> = ({ stats, loading, onNavigate, onApproveAdoption }) => {
  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-24 text-stone-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Aggregating database statistics across 12 tables...</p>
        </div>
      </div>
    );
  }

  const {
    petStats,
    adoptionStats,
    donationTotals,
    orderTotals,
    inventoryStats,
    apptStats,
    speciesDistribution,
    topBreeds,
    recentActivity
  } = stats;

  const totalRevenue = (Number(donationTotals.total_donations) || 0) + (Number(orderTotals.total_sales) || 0);
  const adoptionRate = petStats.total_pets > 0 
    ? Math.round(((petStats.adopted_pets || 0) / petStats.total_pets) * 100) 
    : 0;

  const statusPieData = [
    { name: 'Available', value: Number(petStats.available_pets) || 0, color: '#059669' },
    { name: 'Adopted', value: Number(petStats.adopted_pets) || 0, color: '#3b82f6' },
    { name: 'Under Treatment', value: Number(petStats.treatment_pets) || 0, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome & Summary Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-stone-100 tracking-tight">Fur-mula 3.0 Control Center</h1>
            <p className="text-sm text-stone-400 mt-1">
              Live automated shelter telemetry, veterinary health records, and inventory logistics.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('sql')}
              className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Activity className="w-4 h-4" />
              Open SQL Workbench
            </button>
            <button
              onClick={() => onNavigate('pets')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <PawPrint className="w-4 h-4" />
              Manage Pets & Adoptions
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pets Rescued Card */}
        <div 
          onClick={() => onNavigate('pets')} 
          className="bg-stone-900 border border-stone-800 hover:border-emerald-500/50 rounded-2xl p-5 shadow-sm cursor-pointer transition-all hover:bg-stone-850"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-stone-400">Total Animals</span>
            <span className="p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/60">
              <PawPrint className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-stone-100">{petStats.total_pets || 0}</span>
            <span className="text-xs font-semibold text-emerald-400">{petStats.available_pets || 0} Available</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-stone-400">
            <span className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 font-medium">
              {petStats.adopted_pets || 0} Adopted ({adoptionRate}%)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-950/60 text-amber-300 font-medium border border-amber-900/40">
              {petStats.treatment_pets || 0} In Clinic
            </span>
          </div>
        </div>

        {/* Adoption Pipeline Card */}
        <div 
          onClick={() => onNavigate('pets')} 
          className="bg-stone-900 border border-stone-800 hover:border-blue-500/50 rounded-2xl p-5 shadow-sm cursor-pointer transition-all hover:bg-stone-850"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-stone-400">Adoption Requests</span>
            <span className="p-2 rounded-xl bg-blue-950 text-blue-400 border border-blue-800/60">
              <Heart className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-stone-100">{adoptionStats.total_applications || 0}</span>
            <span className="text-xs font-semibold text-amber-400">{adoptionStats.pending_adoptions || 0} Pending</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-stone-400">
            <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-900 font-medium">
              {adoptionStats.approved_adoptions || 0} Approved
            </span>
            <span className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-400 font-medium">
              {adoptionStats.rejected_adoptions || 0} Rejected
            </span>
          </div>
        </div>

        {/* Inventory & Logistics Card */}
        <div 
          onClick={() => onNavigate('store')} 
          className="bg-stone-900 border border-stone-800 hover:border-amber-500/50 rounded-2xl p-5 shadow-sm cursor-pointer transition-all hover:bg-stone-850"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-stone-400">Store Logistics</span>
            <span className={`p-2 rounded-xl border ${
              (inventoryStats.low_stock_count || 0) > 0 
                ? 'bg-amber-950 text-amber-400 border-amber-800/80 animate-pulse' 
                : 'bg-stone-800 text-stone-300 border-stone-700'
            }`}>
              <ShoppingBag className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-stone-100">{inventoryStats.total_products || 0}</span>
            <span className="text-xs text-stone-400">Catalog SKUs</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            {(inventoryStats.low_stock_count || 0) > 0 ? (
              <span className="px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 font-bold border border-amber-800 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {inventoryStats.low_stock_count} Low Stock
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 font-medium border border-emerald-900">
                Stock Healthy
              </span>
            )}
            <span className="text-stone-400">Val: ৳{Number(inventoryStats.inventory_value).toLocaleString()}</span>
          </div>
        </div>

        {/* Total Funds & Revenue Card */}
        <div 
          onClick={() => onNavigate('donations')} 
          className="bg-stone-900 border border-stone-800 hover:border-emerald-500/50 rounded-2xl p-5 shadow-sm cursor-pointer transition-all hover:bg-stone-850"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-stone-400">Total Funds & Revenue</span>
            <span className="p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/60">
              <DollarSign className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-stone-100">৳{totalRevenue.toLocaleString()}</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-stone-400">
            <span className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 font-medium">
              ৳{Number(donationTotals.total_donations).toLocaleString()} Donated
            </span>
            <span className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 font-medium">
              ৳{Number(orderTotals.total_sales).toLocaleString()} Sales
            </span>
          </div>
        </div>
      </div>

      {/* Low Stock Automated Alert Banner (Business Logic Requirement) */}
      {(inventoryStats.low_stock_count || 0) > 0 && (
        <div className="bg-amber-950/40 border border-amber-800/70 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-900/60 border border-amber-700 text-amber-300">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-100">Automatic Stock Alert Triggered</h4>
              <p className="text-xs text-amber-300/80">
                {inventoryStats.low_stock_count} item(s) in pet care supplies have fallen below safety inventory thresholds (≤ 5 units).
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('store')}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-900 text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            Review Inventory & Reorder
          </button>
        </div>
      )}

      {/* Analytics Charts & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Species & Breed Distribution Bar Chart */}
        <div className="lg:col-span-2 bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-stone-100">Animals by Breed & Species</h3>
              <p className="text-xs text-stone-400">Breakdown of rescued animals in shelter care</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-stone-800 text-stone-300 font-medium">
              {topBreeds.length} Registered Breeds
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topBreeds} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis 
                  dataKey="breed_name" 
                  tick={{ fill: '#a8a29e', fontSize: 11 }} 
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis allowDecimals={false} tick={{ fill: '#a8a29e', fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1c1917', borderColor: '#44403c', borderRadius: '0.75rem', color: '#f5f5f4' }} 
                  labelStyle={{ color: '#10b981', fontWeight: 'bold' }}
                />
                <Bar dataKey="pet_count" name="Count" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shelter Status Pie Chart */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-100">Adoption & Status Pipeline</h3>
            <p className="text-xs text-stone-400">Current status distribution of shelter pets</p>
          </div>

          <div className="h-48 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1c1917', borderColor: '#44403c', borderRadius: '0.75rem', color: '#f5f5f4' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-stone-800 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-stone-300">
                <span className="w-3 h-3 rounded-full bg-emerald-600"></span> Available for Adoption
              </span>
              <span className="font-bold text-stone-100">{petStats.available_pets || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-stone-300">
                <span className="w-3 h-3 rounded-full bg-blue-600"></span> Adopted Pets
              </span>
              <span className="font-bold text-stone-100">{petStats.adopted_pets || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-stone-300">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span> Under Treatment
              </span>
              <span className="font-bold text-stone-100">{petStats.treatment_pets || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Realtime 4-Way Operational Feeds */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recent Adoptions Feed */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-400" /> Recent Adoptions
              </span>
              <button 
                onClick={() => onNavigate('pets')}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
              >
                View all →
              </button>
            </div>
            <div className="space-y-2.5">
              {recentActivity.recentAdoptions.slice(0, 3).map((ad: any) => (
                <div key={ad.adoption_id} className="p-2.5 rounded-xl bg-stone-950 border border-stone-800/80 text-xs">
                  <div className="flex items-center justify-between font-bold text-stone-200">
                    <span>{ad.pet_name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      ad.application_status === 'Approved' 
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {ad.application_status}
                    </span>
                  </div>
                  <div className="text-stone-400 text-[11px] mt-1">Adopter: {ad.user_name}</div>
                  <div className="text-stone-500 text-[10px] mt-0.5">{ad.adoption_date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vet Appointments Feed */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" /> Clinic Appointments
              </span>
              <button 
                onClick={() => onNavigate('vets')}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
              >
                View all →
              </button>
            </div>
            <div className="space-y-2.5">
              {recentActivity.recentAppointments.slice(0, 3).map((app: any) => (
                <div key={app.appointment_id} className="p-2.5 rounded-xl bg-stone-950 border border-stone-800/80 text-xs">
                  <div className="flex items-center justify-between font-bold text-stone-200">
                    <span>{app.pet_name}</span>
                    <span className="text-[10px] text-blue-400 font-medium truncate max-w-[90px]">{app.doctor_name}</span>
                  </div>
                  <div className="text-stone-400 text-[11px] mt-1 line-clamp-1">{app.reason}</div>
                  <div className="text-stone-500 text-[10px] mt-0.5">{app.appointment_date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Store Orders Feed */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-400" /> Recent Supply Orders
              </span>
              <button 
                onClick={() => onNavigate('store')}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
              >
                View all →
              </button>
            </div>
            <div className="space-y-2.5">
              {recentActivity.recentOrders.slice(0, 3).map((ord: any) => (
                <div key={ord.order_id} className="p-2.5 rounded-xl bg-stone-950 border border-stone-800/80 text-xs">
                  <div className="flex items-center justify-between font-bold text-stone-200">
                    <span>Order #{ord.order_id}</span>
                    <span className="text-emerald-400 font-bold">৳{Number(ord.total_amount).toLocaleString()}</span>
                  </div>
                  <div className="text-stone-400 text-[11px] mt-1">By: {ord.customer_name}</div>
                  <div className="text-stone-500 text-[10px] mt-0.5">{ord.order_date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Community Donations Feed */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Community Donations
              </span>
              <button 
                onClick={() => onNavigate('donations')}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
              >
                View all →
              </button>
            </div>
            <div className="space-y-2.5">
              {recentActivity.recentDonations.slice(0, 3).map((don: any) => (
                <div key={don.donation_id} className="p-2.5 rounded-xl bg-stone-950 border border-stone-800/80 text-xs">
                  <div className="flex items-center justify-between font-bold text-stone-200">
                    <span>{don.donor_name}</span>
                    <span className="text-emerald-400 font-bold">৳{Number(don.amount).toLocaleString()}</span>
                  </div>
                  <div className="text-stone-400 text-[11px] mt-1">Via: {don.payment_method}</div>
                  <div className="text-stone-500 text-[10px] mt-0.5">{don.donation_date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
