import React, { useState, useEffect } from 'react';
import { 
  Navbar, 
  NavTab 
} from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { PetsAdoptionView } from './components/PetsAdoptionView';
import { VetClinicView } from './components/VetClinicView';
import { StoreLogisticsView } from './components/StoreLogisticsView';
import { DonationsView } from './components/DonationsView';
import { UsersView } from './components/UsersView';
import { SqlWorkbench } from './components/SqlWorkbench';
import { TableExplorer } from './components/TableExplorer';
import { 
  DashboardStats, 
  Pet, 
  Adoption,
  Breed, 
  VetDoctor, 
  Appointment, 
  MedicalRecord, 
  PetProduct, 
  ProductCategory, 
  Order, 
  Donation, 
  User 
} from './types';
import { api } from './services/api';
import { Sparkles, Database, ShieldCheck, Heart } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Core State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [adoptions, setAdoptions] = useState<Adoption[]>([]);
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [vets, setVets] = useState<VetDoctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [products, setProducts] = useState<PetProduct[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Load all initial domain data
  const loadAllData = async () => {
    try {
      setRefreshing(true);
      const [
        statsData,
        petsData,
        adoptionsData,
        breedsData,
        vetsData,
        apptsData,
        medsData,
        prodsData,
        catsData,
        ordersData,
        donationsData,
        usersData,
      ] = await Promise.all([
        api.getDashboardStats(),
        api.getPets(),
        api.getAdoptions(),
        api.getBreeds(),
        api.getVets(),
        api.getAppointments(),
        api.getMedicalRecords(),
        api.getProducts(),
        api.getCategories(),
        api.getOrders(),
        api.getDonations(),
        api.getUsers(),
      ]);

      setStats(statsData);
      setPets(petsData);
      setAdoptions(adoptionsData);
      setBreeds(breedsData);
      setVets(vetsData);
      setAppointments(apptsData);
      setMedicalRecords(medsData);
      setProducts(prodsData);
      setCategories(catsData);
      setOrders(ordersData);
      setDonations(donationsData);
      setUsers(usersData);
    } catch (err) {
      console.error('Failed to load Fur-mula 3.0 data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* Top Application Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lowStockCount={stats?.lowStockCount || 0}
        pendingAdoptionsCount={stats?.pendingAdoptionsCount || 0}
        onRefresh={loadAllData}
        refreshing={refreshing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="w-12 h-12 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center">
              <h3 className="text-base font-bold text-stone-200">Initializing Fur-mula 3.0 Engine</h3>
              <p className="text-xs text-stone-500 mt-1">Connecting to 12 relational database tables & analytics...</p>
            </div>
          </div>
        ) : (
          <div>
            {activeTab === 'dashboard' && stats && (
              <Dashboard
                stats={stats}
                loading={loading}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'pets' && (
              <PetsAdoptionView
                pets={pets}
                adoptions={adoptions}
                breeds={breeds}
                users={users}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === 'vet' && (
              <VetClinicView
                vets={vets}
                appointments={appointments}
                medicalRecords={medicalRecords}
                pets={pets}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === 'store' && (
              <StoreLogisticsView
                products={products}
                categories={categories}
                orders={orders}
                users={users}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === 'donations' && (
              <DonationsView
                donations={donations}
                users={users}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === 'users' && (
              <UsersView
                users={users}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === 'sql' && (
              <SqlWorkbench />
            )}

            {activeTab === 'tables' && (
              <TableExplorer />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-stone-900/60 border-t border-stone-800/80 py-4 px-6 text-center text-xs text-stone-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-300">Fur-mula 3.0</span>
            <span>•</span>
            <span>Integrated Pet Adoption, Care & Logistics DBMS</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-stone-400">
            <span className="flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              12 Relational Tables
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              ACID Transaction Safe
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
