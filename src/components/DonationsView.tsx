import React, { useState } from 'react';
import { 
  HeartHandshake, 
  Plus, 
  DollarSign, 
  CreditCard, 
  Trash2, 
  TrendingUp, 
  User, 
  Award,
  Calendar,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Donation, User as UserType } from '../types';
import { api } from '../services/api';

interface DonationsViewProps {
  donations: Donation[];
  users: UserType[];
  onRefresh: () => void;
}

export const DonationsView: React.FC<DonationsViewProps> = ({
  donations,
  users,
  onRefresh
}) => {
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [donationForm, setDonationForm] = useState({
    user_id: users.find(u => u.user_type === 'Donor')?.user_id || users[0]?.user_id || 1,
    amount: '',
    donation_date: new Date().toISOString().split('T')[0],
    payment_method: 'bKash',
  });

  const totalDonations = donations.reduce((sum, d) => sum + Number(d.amount), 0);

  // Group by payment method
  const paymentMethodsSummary: Record<string, number> = {};
  donations.forEach(d => {
    const method = d.payment_method || 'Other';
    paymentMethodsSummary[method] = (paymentMethodsSummary[method] || 0) + Number(d.amount);
  });

  // Top Donors
  const donorContributions: Record<string, { name: string; amount: number; count: number }> = {};
  donations.forEach(d => {
    const donorKey = d.donor_name || 'Anonymous';
    if (!donorContributions[donorKey]) {
      donorContributions[donorKey] = { name: donorKey, amount: 0, count: 0 };
    }
    donorContributions[donorKey].amount += Number(d.amount);
    donorContributions[donorKey].count += 1;
  });

  const topDonors = Object.values(donorContributions).sort((a, b) => b.amount - a.amount);

  const handleRecordDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      await api.recordDonation({
        user_id: donationForm.user_id ? Number(donationForm.user_id) : undefined,
        amount: parseFloat(donationForm.amount),
        donation_date: donationForm.donation_date,
        payment_method: donationForm.payment_method,
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      setFeedback({ type: 'success', message: `Thank you! ৳${donationForm.amount} donation successfully recorded in the shelter ledger.` });
      setShowModal(false);
      setDonationForm({
        user_id: users[0]?.user_id || 1,
        amount: '',
        donation_date: new Date().toISOString().split('T')[0],
        payment_method: 'bKash',
      });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDonation = async (id: number) => {
    if (!window.confirm('Delete this donation record from the database ledger?')) return;
    try {
      await api.deleteDonation(id);
      setFeedback({ type: 'success', message: 'Donation entry removed.' });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
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

      {/* Main Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-stone-100">Donations & Community Care</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-medium">
                Donations Table Ledger
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Record voluntary financial contributions that keep shelter rescue and veterinary care operations sustained.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            id="record-donation-btn"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Record Donation
          </button>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-stone-950 border border-stone-800 p-4 rounded-xl">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block">Total Raised</span>
            <span className="text-2xl font-black font-mono text-emerald-400">৳{totalDonations.toLocaleString()}</span>
          </div>

          <div className="bg-stone-950 border border-stone-800 p-4 rounded-xl">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block">Total Contributions</span>
            <span className="text-2xl font-black font-mono text-stone-100">{donations.length} Transactions</span>
          </div>

          <div className="bg-stone-950 border border-stone-800 p-4 rounded-xl">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block">Top Payment Method</span>
            <span className="text-xl font-bold text-amber-400">
              {Object.keys(paymentMethodsSummary).sort((a, b) => paymentMethodsSummary[b] - paymentMethodsSummary[a])[0] || 'bKash'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Donations Ledger and Donor Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Ledger Table */}
        <div className="lg:col-span-2 bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-stone-850 border-b border-stone-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-100">Donations Ledger (Table: Donations)</h3>
            <span className="text-xs text-stone-400 font-mono">{donations.length} Entries</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-950 text-stone-400 uppercase tracking-wider text-[10px] font-bold border-b border-stone-800">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Donor Name</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/80">
                {donations.map((d) => (
                  <tr key={d.donation_id} className="hover:bg-stone-850/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-stone-500">#{d.donation_id}</td>
                    <td className="px-4 py-3 font-bold text-stone-100">
                      {d.donor_name}
                      {d.donor_email && <span className="text-[10px] text-stone-400 block font-normal">{d.donor_email}</span>}
                    </td>
                    <td className="px-4 py-3 font-mono font-extrabold text-emerald-400">
                      ৳{Number(d.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-200 text-[11px] font-medium border border-stone-700">
                        {d.payment_method || 'bKash'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-stone-300 font-mono">{d.donation_date}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteDonation(d.donation_id)}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-950 hover:text-rose-400 text-stone-400 text-xs transition-colors cursor-pointer"
                        title="Delete Donation Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Donors Leaderboard */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-stone-100">Top Community Donors</h3>
              <p className="text-xs text-stone-400">Honoring individuals supporting shelter care</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {topDonors.map((donor, idx) => (
              <div
                key={donor.name}
                className="flex items-center justify-between p-3 rounded-xl bg-stone-950 border border-stone-800/80 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                    idx === 0 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                      : idx === 1 
                      ? 'bg-slate-500/20 text-slate-300 border border-slate-500/40' 
                      : 'bg-stone-800 text-stone-400'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-stone-200 block">{donor.name}</span>
                    <span className="text-[10px] text-stone-400">{donor.count} Contribution(s)</span>
                  </div>
                </div>

                <span className="font-mono font-bold text-emerald-400">
                  ৳{donor.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RECORD DONATION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-extrabold text-base text-stone-100 flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-emerald-400" />
                Record Community Donation
              </h3>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleRecordDonation} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-300 font-medium mb-1">Select Donor / User</label>
                <select
                  value={donationForm.user_id}
                  onChange={(e) => setDonationForm({ ...donationForm, user_id: Number(e.target.value) })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-emerald-500"
                >
                  {users.map((u) => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.name} ({u.email}) - {u.user_type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-300 font-medium mb-1">Donation Amount (৳) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={donationForm.amount}
                  onChange={(e) => setDonationForm({ ...donationForm, amount: e.target.value })}
                  placeholder="e.g. 5000.00"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 text-base font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-medium mb-1">Payment Method</label>
                  <select
                    value={donationForm.payment_method}
                    onChange={(e) => setDonationForm({ ...donationForm, payment_method: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Rocket">Rocket</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-300 font-medium mb-1">Donation Date *</label>
                  <input
                    type="date"
                    required
                    value={donationForm.donation_date}
                    onChange={(e) => setDonationForm({ ...donationForm, donation_date: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
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
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Record Donation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
