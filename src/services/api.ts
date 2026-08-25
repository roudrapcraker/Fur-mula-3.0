import { DashboardStats, Pet, Adoption, VetDoctor, Appointment, MedicalRecord, PetProduct, ProductCategory, Order, Donation, User, Breed, TableSchema } from '../types';

async function fetchJson<T = any>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await fetchJson<{ success: boolean; data: DashboardStats }>('/api/stats/dashboard');
    return res.data;
  },

  // SQL Runner
  executeSql: async (sql: string) => {
    return await fetchJson<{
      success: boolean;
      type: 'SELECT' | 'MUTATION';
      rows?: any[];
      columns?: string[];
      rowCount?: number;
      changes?: number;
      lastInsertRowid?: number;
      executionTimeMs: number;
      message?: string;
    }>('/api/sql/execute', {
      method: 'POST',
      body: JSON.stringify({ sql }),
    });
  },

  // Schema & DB utilities
  getDbSchema: async (): Promise<TableSchema[]> => {
    const res = await fetchJson<{ success: boolean; tables: TableSchema[] }>('/api/db/schema');
    return res.tables;
  },

  resetDatabase: async (): Promise<string> => {
    const res = await fetchJson<{ success: boolean; message: string }>('/api/db/reset', {
      method: 'POST',
    });
    return res.message;
  },

  // Pets
  getPets: async (): Promise<Pet[]> => {
    const res = await fetchJson<{ success: boolean; data: Pet[] }>('/api/pets');
    return res.data;
  },
  createPet: async (pet: Partial<Pet>) => {
    return await fetchJson('/api/pets', { method: 'POST', body: JSON.stringify(pet) });
  },
  updatePet: async (id: number, pet: Partial<Pet>) => {
    return await fetchJson(`/api/pets/${id}`, { method: 'PUT', body: JSON.stringify(pet) });
  },
  deletePet: async (id: number) => {
    return await fetchJson(`/api/tables/Pets/pet_id/${id}`, { method: 'DELETE' });
  },

  // Adoptions
  getAdoptions: async (): Promise<Adoption[]> => {
    const res = await fetchJson<{ success: boolean; data: Adoption[] }>('/api/adoptions');
    return res.data;
  },
  createAdoption: async (adoption: { user_id: number; pet_id: number; adoption_date?: string; application_status?: string }) => {
    return await fetchJson('/api/adoptions', { method: 'POST', body: JSON.stringify(adoption) });
  },
  updateAdoptionStatus: async (id: number, status: 'Pending' | 'Approved' | 'Rejected') => {
    return await fetchJson(`/api/adoptions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
  deleteAdoption: async (id: number) => {
    return await fetchJson(`/api/tables/Adoptions/adoption_id/${id}`, { method: 'DELETE' });
  },

  // Vets & Clinic
  getVets: async (): Promise<VetDoctor[]> => {
    const res = await fetchJson<{ success: boolean; data: VetDoctor[] }>('/api/vets');
    return res.data;
  },
  createVet: async (vet: Partial<VetDoctor>) => {
    return await fetchJson('/api/tables/Vets_Doctors', { method: 'POST', body: JSON.stringify(vet) });
  },
  getAppointments: async (): Promise<Appointment[]> => {
    const res = await fetchJson<{ success: boolean; data: Appointment[] }>('/api/appointments');
    return res.data;
  },
  createAppointment: async (appt: { pet_id: number; vet_id: number; appointment_date: string; reason?: string }) => {
    return await fetchJson('/api/appointments', { method: 'POST', body: JSON.stringify(appt) });
  },
  deleteAppointment: async (id: number) => {
    return await fetchJson(`/api/tables/Appointments/appointment_id/${id}`, { method: 'DELETE' });
  },

  // Medical Records
  getMedicalRecords: async (): Promise<MedicalRecord[]> => {
    const res = await fetchJson<{ success: boolean; data: MedicalRecord[] }>('/api/medical-records');
    return res.data;
  },
  createMedicalRecord: async (record: { pet_id: number; diagnosis: string; treatment_date: string; vaccine_given?: string; update_pet_status?: string }) => {
    return await fetchJson('/api/medical-records', { method: 'POST', body: JSON.stringify(record) });
  },
  deleteMedicalRecord: async (id: number) => {
    return await fetchJson(`/api/tables/Medical_Records/record_id/${id}`, { method: 'DELETE' });
  },

  // Products & Store
  getProducts: async (): Promise<PetProduct[]> => {
    const res = await fetchJson<{ success: boolean; data: PetProduct[] }>('/api/products');
    return res.data;
  },
  createProduct: async (prod: Partial<PetProduct>) => {
    return await fetchJson('/api/tables/Pet_Products', { method: 'POST', body: JSON.stringify(prod) });
  },
  updateProduct: async (id: number, prod: Partial<PetProduct>) => {
    return await fetchJson(`/api/tables/Pet_Products/product_id/${id}`, { method: 'PUT', body: JSON.stringify(prod) });
  },
  deleteProduct: async (id: number) => {
    return await fetchJson(`/api/tables/Pet_Products/product_id/${id}`, { method: 'DELETE' });
  },
  getCategories: async (): Promise<ProductCategory[]> => {
    const res = await fetchJson<{ success: boolean; data: ProductCategory[] }>('/api/categories');
    return res.data;
  },
  createCategory: async (category_name: string) => {
    return await fetchJson('/api/tables/Product_Categories', { method: 'POST', body: JSON.stringify({ category_name }) });
  },
  getOrders: async (): Promise<Order[]> => {
    const res = await fetchJson<{ success: boolean; data: Order[] }>('/api/orders');
    return res.data;
  },
  checkoutOrder: async (payload: { user_id: number; items: Array<{ product_id: number; quantity: number }> }) => {
    return await fetchJson('/api/orders/checkout', { method: 'POST', body: JSON.stringify(payload) });
  },

  // Donations
  getDonations: async (): Promise<Donation[]> => {
    const res = await fetchJson<{ success: boolean; data: Donation[] }>('/api/donations');
    return res.data;
  },
  recordDonation: async (donation: { user_id?: number | null; amount: number; donation_date?: string; payment_method?: string }) => {
    return await fetchJson('/api/donations', { method: 'POST', body: JSON.stringify(donation) });
  },
  deleteDonation: async (id: number) => {
    return await fetchJson(`/api/tables/Donations/donation_id/${id}`, { method: 'DELETE' });
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    const res = await fetchJson<{ success: boolean; data: User[] }>('/api/users');
    return res.data;
  },
  createUser: async (user: Partial<User>) => {
    return await fetchJson('/api/tables/Users', { method: 'POST', body: JSON.stringify(user) });
  },
  updateUser: async (id: number, user: Partial<User>) => {
    return await fetchJson(`/api/tables/Users/user_id/${id}`, { method: 'PUT', body: JSON.stringify(user) });
  },
  deleteUser: async (id: number) => {
    return await fetchJson(`/api/tables/Users/user_id/${id}`, { method: 'DELETE' });
  },

  // Breeds
  getBreeds: async (): Promise<Breed[]> => {
    const res = await fetchJson<{ success: boolean; data: Breed[] }>('/api/breeds');
    return res.data;
  },
  createBreed: async (breed: { breed_name: string; species: string }) => {
    return await fetchJson('/api/tables/Breeds', { method: 'POST', body: JSON.stringify(breed) });
  },

  // Generic Table Explorer
  getTableData: async (tableName: string) => {
    return await fetchJson<{ success: boolean; tableName: string; columns: any[]; rows: any[]; total: number }>(`/api/tables/${tableName}`);
  },
  insertTableRow: async (tableName: string, data: any) => {
    return await fetchJson(`/api/tables/${tableName}`, { method: 'POST', body: JSON.stringify(data) });
  },
  updateTableRow: async (tableName: string, pkCol: string, pkVal: any, data: any) => {
    return await fetchJson(`/api/tables/${tableName}/${pkCol}/${pkVal}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  deleteTableRow: async (tableName: string, pkCol: string, pkVal: any) => {
    return await fetchJson(`/api/tables/${tableName}/${pkCol}/${pkVal}`, { method: 'DELETE' });
  },
};
