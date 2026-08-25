export interface User {
  user_id: number;
  name: string;
  email: string;
  phone?: string;
  user_type: 'Adopter' | 'Donor' | 'General';
  address?: string;
  adoption_count?: number;
  order_count?: number;
  total_donated?: number;
}

export interface Breed {
  breed_id: number;
  breed_name: string;
  species: string;
  pet_count?: number;
}

export interface Pet {
  pet_id: number;
  name: string;
  age?: number;
  gender?: string;
  status: 'Available' | 'Adopted' | 'Under Treatment';
  breed_id?: number;
  breed_name?: string;
  species?: string;
  medical_count?: number;
  appointment_count?: number;
  is_adopted_in_record?: number;
}

export interface Adoption {
  adoption_id: number;
  user_id: number;
  pet_id: number;
  adoption_date: string;
  application_status: 'Pending' | 'Approved' | 'Rejected';
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  user_address?: string;
  pet_name?: string;
  pet_status?: string;
  pet_age?: number;
  pet_gender?: string;
  breed_name?: string;
  species?: string;
}

export interface VetDoctor {
  vet_id: number;
  doctor_name: string;
  specialization?: string;
  phone?: string;
  clinic_address?: string;
  appointment_count?: number;
}

export interface Appointment {
  appointment_id: number;
  pet_id: number;
  vet_id: number;
  appointment_date: string;
  reason?: string;
  pet_name?: string;
  pet_status?: string;
  doctor_name?: string;
  specialization?: string;
  vet_phone?: string;
  clinic_address?: string;
}

export interface MedicalRecord {
  record_id: number;
  pet_id: number;
  diagnosis?: string;
  treatment_date: string;
  vaccine_given?: string;
  pet_name?: string;
  pet_age?: number;
  pet_gender?: string;
  breed_name?: string;
  species?: string;
}

export interface ProductCategory {
  category_id: number;
  category_name: string;
  product_count?: number;
}

export interface PetProduct {
  product_id: number;
  product_name: string;
  price: number;
  stock_quantity: number;
  category_id?: number;
  category_name?: string;
  stock_status?: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export interface OrderItem {
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  product_name?: string;
  category_name?: string;
}

export interface Order {
  order_id: number;
  user_id: number;
  order_date: string;
  total_amount: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  items?: OrderItem[];
}

export interface Donation {
  donation_id: number;
  user_id?: number;
  amount: number;
  donation_date: string;
  payment_method?: string;
  donor_name?: string;
  donor_email?: string;
  donor_phone?: string;
}

export interface TableColumn {
  cid: number;
  name: string;
  type: string;
  notnull: boolean;
  dflt_value: any;
  pk: boolean;
}

export interface TableForeignKey {
  id: number;
  seq: number;
  table: string;
  from: string;
  to: string;
  on_update: string;
  on_delete: string;
}

export interface TableSchema {
  name: string;
  columns: TableColumn[];
  foreignKeys: TableForeignKey[];
  rowCount: number;
}

export interface DashboardStats {
  petStats: {
    total_pets: number;
    available_pets: number;
    adopted_pets: number;
    treatment_pets: number;
  };
  adoptionStats: {
    total_applications: number;
    approved_adoptions: number;
    pending_adoptions: number;
    rejected_adoptions: number;
  };
  donationTotals: {
    donation_count: number;
    total_donations: number;
  };
  orderTotals: {
    order_count: number;
    total_sales: number;
  };
  inventoryStats: {
    total_products: number;
    low_stock_count: number;
    out_of_stock_count: number;
    inventory_value: number;
  };
  apptStats: {
    total_appointments: number;
    upcoming_appointments: number;
  };
  speciesDistribution: Array<{ species: string; count: number }>;
  topBreeds: Array<{ breed_name: string; species: string; pet_count: number }>;
  recentActivity: {
    recentAdoptions: any[];
    recentAppointments: any[];
    recentOrders: any[];
    recentDonations: any[];
  };
}
