import React, { useState } from 'react';
import { 
  Users as UsersIcon, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  Heart, 
  ShoppingBag, 
  DollarSign,
  UserCheck
} from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';

interface UsersViewProps {
  users: User[];
  onRefresh: () => void;
}

export const UsersView: React.FC<UsersViewProps> = ({ users, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    user_type: 'General' as 'Adopter' | 'Donor' | 'General',
    address: '',
  });

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm));
    const matchesRole = roleFilter === 'ALL' || u.user_type === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      if (editingUser) {
        await api.updateUser(editingUser.user_id, form);
        setFeedback({ type: 'success', message: `User ${form.name} updated successfully!` });
      } else {
        await api.createUser(form);
        setFeedback({ type: 'success', message: `User ${form.name} registered successfully!` });
      }
      setShowModal(false);
      setEditingUser(null);
      setForm({
        name: '',
        email: '',
        phone: '',
        user_type: 'General',
        address: '',
      });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: number, name: string) => {
    if (!window.confirm(`Delete user ${name}? Any cascading records like orders/adoptions will be updated or deleted.`)) return;
    try {
      await api.deleteUser(id);
      setFeedback({ type: 'success', message: `User ${name} removed.` });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      user_type: user.user_type,
      address: user.address || '',
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6 pb-12">
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

      {/* Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-stone-100">User & Membership Directory</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 font-medium">
                Table: Users
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Manage adopters, donors, and general shelter supporters with linked adoption and transaction metrics.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingUser(null);
              setForm({
                name: '',
                email: '',
                phone: '',
                user_type: 'General',
                address: '',
              });
              setShowModal(true);
            }}
            id="register-user-btn"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Register New User
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-4 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-300 focus:outline-none focus:border-blue-500 cursor-pointer w-full sm:w-auto"
          >
            <option value="ALL">All Roles</option>
            <option value="Adopter">Adopters</option>
            <option value="Donor">Donors</option>
            <option value="General">General</option>
          </select>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => {
          const isAdopter = user.user_type === 'Adopter';
          const isDonor = user.user_type === 'Donor';

          return (
            <div
              key={user.user_id}
              className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between hover:border-stone-700 transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isAdopter 
                        ? 'bg-rose-950 text-rose-300 border border-rose-800' 
                        : isDonor 
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                        : 'bg-stone-800 text-stone-300 border border-stone-700'
                    }`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-100 text-sm flex items-center gap-1.5">
                        {user.name}
                        <span className="text-[10px] font-mono text-stone-500">#{user.user_id}</span>
                      </h4>
                      <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold border ${
                        isAdopter
                          ? 'bg-rose-950 text-rose-300 border-rose-800'
                          : isDonor
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : 'bg-stone-800 text-stone-300 border-stone-700'
                      }`}>
                        {user.user_type}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(user)}
                      className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition-colors cursor-pointer"
                      title="Edit User"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.user_id, user.name)}
                      className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-950 hover:text-rose-400 text-stone-400 text-xs transition-colors cursor-pointer"
                      title="Delete User"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 pt-3 text-xs text-stone-400">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-stone-500" />
                    <span className="text-stone-300">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-stone-500" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{user.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* User activity footer pills */}
              <div className="pt-3 border-t border-stone-800 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-stone-950 p-2 rounded-xl border border-stone-800">
                  <span className="text-[10px] text-stone-500 block">Adoptions</span>
                  <span className="font-bold text-rose-400">{user.adoption_count || 0}</span>
                </div>
                <div className="bg-stone-950 p-2 rounded-xl border border-stone-800">
                  <span className="text-[10px] text-stone-500 block">Orders</span>
                  <span className="font-bold text-amber-400">{user.order_count || 0}</span>
                </div>
                <div className="bg-stone-950 p-2 rounded-xl border border-stone-800">
                  <span className="text-[10px] text-stone-500 block">Donated</span>
                  <span className="font-bold font-mono text-emerald-400">৳{Number(user.total_donated || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD / EDIT USER MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-extrabold text-base text-stone-100 flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-blue-400" />
                {editingUser ? 'Update User Details' : 'Register New User'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-300 font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Tanvir Ahmed"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-medium mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="e.g. tanvir@gmail.com"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-medium mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="e.g. 01822222222"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-medium mb-1">User Classification</label>
                  <select
                    value={form.user_type}
                    onChange={(e) => setForm({ ...form, user_type: e.target.value as any })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="General">General User</option>
                    <option value="Adopter">Adopter</option>
                    <option value="Donor">Donor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-medium mb-1">Postal Address</label>
                <textarea
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="e.g. Uttara, Dhaka"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingUser ? 'Update User' : 'Register User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
