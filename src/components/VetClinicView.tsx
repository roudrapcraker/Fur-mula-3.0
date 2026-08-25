import React, { useState } from 'react';
import { 
  Stethoscope, 
  Calendar, 
  Plus, 
  Search, 
  FileText, 
  Syringe, 
  UserPlus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone,
  ShieldAlert,
  Activity
} from 'lucide-react';
import { VetDoctor, Appointment, MedicalRecord, Pet } from '../types';
import { api } from '../services/api';

interface VetClinicViewProps {
  vets: VetDoctor[];
  appointments: Appointment[];
  medicalRecords: MedicalRecord[];
  pets: Pet[];
  onRefresh: () => void;
}

export const VetClinicView: React.FC<VetClinicViewProps> = ({
  vets,
  appointments,
  medicalRecords,
  pets,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'appointments' | 'medical' | 'vets'>('appointments');
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [showApptModal, setShowApptModal] = useState(false);
  const [showMedicalModal, setShowMedicalModal] = useState(false);
  const [showVetModal, setShowVetModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [apptForm, setApptForm] = useState({
    pet_id: pets[0]?.pet_id || 1,
    vet_id: vets[0]?.vet_id || 1,
    appointment_date: new Date().toISOString().slice(0, 16).replace('T', ' '),
    reason: '',
  });

  const [medicalForm, setMedicalForm] = useState({
    pet_id: pets[0]?.pet_id || 1,
    diagnosis: '',
    treatment_date: new Date().toISOString().split('T')[0],
    vaccine_given: '',
    update_pet_status: 'none',
  });

  const [vetForm, setVetForm] = useState({
    doctor_name: '',
    specialization: 'Veterinary Surgeon',
    phone: '',
    clinic_address: '',
  });

  // Handle Book Appointment
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      await api.createAppointment({
        pet_id: Number(apptForm.pet_id),
        vet_id: Number(apptForm.vet_id),
        appointment_date: apptForm.appointment_date,
        reason: apptForm.reason || 'General Physical Checkup',
      });
      setFeedback({ type: 'success', message: 'Vet appointment scheduled successfully!' });
      setShowApptModal(false);
      setApptForm({
        pet_id: pets[0]?.pet_id || 1,
        vet_id: vets[0]?.vet_id || 1,
        appointment_date: new Date().toISOString().slice(0, 16).replace('T', ' '),
        reason: '',
      });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Add Medical Record
  const handleCreateMedicalRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      await api.createMedicalRecord({
        pet_id: Number(medicalForm.pet_id),
        diagnosis: medicalForm.diagnosis,
        treatment_date: medicalForm.treatment_date,
        vaccine_given: medicalForm.vaccine_given || undefined,
        update_pet_status: medicalForm.update_pet_status !== 'none' ? medicalForm.update_pet_status : undefined,
      });
      setFeedback({ type: 'success', message: 'Medical & Vaccine log saved to database!' });
      setShowMedicalModal(false);
      setMedicalForm({
        pet_id: pets[0]?.pet_id || 1,
        diagnosis: '',
        treatment_date: new Date().toISOString().split('T')[0],
        vaccine_given: '',
        update_pet_status: 'none',
      });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Add Vet
  const handleCreateVet = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      await api.createVet(vetForm);
      setFeedback({ type: 'success', message: `Dr. ${vetForm.doctor_name} added to clinic roster!` });
      setShowVetModal(false);
      setVetForm({
        doctor_name: '',
        specialization: 'Veterinary Surgeon',
        phone: '',
        clinic_address: '',
      });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAppointment = async (id: number) => {
    if (!window.confirm('Delete this appointment record?')) return;
    try {
      await api.deleteAppointment(id);
      setFeedback({ type: 'success', message: 'Appointment deleted.' });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleDeleteMedicalRecord = async (id: number) => {
    if (!window.confirm('Delete this medical record?')) return;
    try {
      await api.deleteMedicalRecord(id);
      setFeedback({ type: 'success', message: 'Medical record deleted.' });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Alert Feedback */}
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
              <h2 className="text-xl font-bold text-stone-100">Veterinary Care & Health Suite</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 font-medium">
                Vets_Doctors • Appointments • Medical_Records
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Schedule clinical checkups, maintain vaccination logs, and track diagnoses across rescued animals.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowApptModal(true)}
              id="schedule-appt-btn"
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              Schedule Appointment
            </button>
            <button
              onClick={() => setShowMedicalModal(true)}
              id="add-medical-btn"
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Syringe className="w-4 h-4" />
              Log Vaccine / Treatment
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex border-b border-stone-800 mt-6 space-x-6 text-sm">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`pb-3 font-semibold text-xs flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'appointments'
                ? 'text-blue-400 border-b-2 border-blue-500'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Appointments ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab('medical')}
            className={`pb-3 font-semibold text-xs flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'medical'
                ? 'text-emerald-400 border-b-2 border-emerald-500'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Medical & Vaccines History ({medicalRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('vets')}
            className={`pb-3 font-semibold text-xs flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'vets'
                ? 'text-purple-400 border-b-2 border-purple-500'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            Veterinary Doctors ({vets.length})
          </button>
        </div>
      </div>

      {/* APPOINTMENTS TAB */}
      {activeTab === 'appointments' && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-stone-850 border-b border-stone-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-100">Scheduled Appointments List</h3>
            <span className="text-xs text-stone-400">Total: {appointments.length} Appointments</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-950 text-stone-400 uppercase tracking-wider text-[10px] font-bold border-b border-stone-800">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Pet</th>
                  <th className="px-4 py-3">Veterinarian</th>
                  <th className="px-4 py-3">Appointment Date & Time</th>
                  <th className="px-4 py-3">Reason / Chief Complaint</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/80">
                {appointments.map((appt) => (
                  <tr key={appt.appointment_id} className="hover:bg-stone-850/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-stone-500">#{appt.appointment_id}</td>
                    <td className="px-4 py-3 font-bold text-stone-100">
                      {appt.pet_name}
                      <span className="text-[10px] block text-emerald-400 font-normal">{appt.pet_status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-stone-200">{appt.doctor_name}</div>
                      <div className="text-[11px] text-stone-400">{appt.specialization}</div>
                      <div className="text-[10px] text-stone-500">{appt.clinic_address}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-blue-400 font-mono font-medium">
                      {appt.appointment_date}
                    </td>
                    <td className="px-4 py-3 text-stone-300 max-w-xs">{appt.reason || 'General Checkup'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteAppointment(appt.appointment_id)}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-950 hover:text-rose-400 text-stone-400 text-xs transition-colors cursor-pointer"
                        title="Cancel Appointment"
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
      )}

      {/* MEDICAL RECORDS & VACCINES TAB */}
      {activeTab === 'medical' && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-stone-850 border-b border-stone-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-100">Clinical Diagnoses & Vaccination History</h3>
            <span className="text-xs text-stone-400">Total: {medicalRecords.length} Treatment Logs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-950 text-stone-400 uppercase tracking-wider text-[10px] font-bold border-b border-stone-800">
                <tr>
                  <th className="px-4 py-3">Record ID</th>
                  <th className="px-4 py-3">Pet</th>
                  <th className="px-4 py-3">Clinical Diagnosis</th>
                  <th className="px-4 py-3">Vaccine Administered</th>
                  <th className="px-4 py-3">Treatment Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/80">
                {medicalRecords.map((rec) => (
                  <tr key={rec.record_id} className="hover:bg-stone-850/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-stone-500">#{rec.record_id}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-stone-100">{rec.pet_name}</div>
                      <div className="text-[11px] text-stone-400">{rec.breed_name} ({rec.species})</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-stone-200">{rec.diagnosis}</td>
                    <td className="px-4 py-3">
                      {rec.vaccine_given ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-semibold">
                          <Syringe className="w-3 h-3" />
                          {rec.vaccine_given}
                        </span>
                      ) : (
                        <span className="text-stone-500 italic text-[11px]">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-stone-300 font-mono">{rec.treatment_date}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteMedicalRecord(rec.record_id)}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-950 hover:text-rose-400 text-stone-400 text-xs transition-colors cursor-pointer"
                        title="Delete Medical Record"
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
      )}

      {/* VETS DIRECTORY TAB */}
      {activeTab === 'vets' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowVetModal(true)}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Register New Veterinarian
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vets.map((vet) => (
              <div key={vet.vet_id} className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-950 text-purple-400 border border-purple-800/80 flex items-center justify-center font-bold">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-100 text-sm">{vet.doctor_name}</h4>
                      <p className="text-xs text-purple-400 font-medium">{vet.specialization || 'General Vet'}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-stone-500">#{vet.vet_id}</span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-stone-800 text-xs text-stone-400">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-stone-500" />
                    <span>{vet.phone || 'No phone listed'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{vet.clinic_address || 'Clinic address not specified'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SCHEDULE APPOINTMENT MODAL */}
      {showApptModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-extrabold text-base text-stone-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                Schedule Vet Appointment
              </h3>
              <button onClick={() => setShowApptModal(false)} className="text-stone-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-300 font-medium mb-1">Select Pet *</label>
                <select
                  value={apptForm.pet_id}
                  onChange={(e) => setApptForm({ ...apptForm, pet_id: Number(e.target.value) })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-blue-500"
                >
                  {pets.map((p) => (
                    <option key={p.pet_id} value={p.pet_id}>
                      {p.name} ({p.breed_name} - {p.species})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-300 font-medium mb-1">Select Veterinarian Doctor *</label>
                <select
                  value={apptForm.vet_id}
                  onChange={(e) => setApptForm({ ...apptForm, vet_id: Number(e.target.value) })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-blue-500"
                >
                  {vets.map((v) => (
                    <option key={v.vet_id} value={v.vet_id}>
                      {v.doctor_name} ({v.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-300 font-medium mb-1">Appointment Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={apptForm.appointment_date.replace(' ', 'T')}
                  onChange={(e) => setApptForm({ ...apptForm, appointment_date: e.target.value.replace('T', ' ') + ':00' })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-medium mb-1">Reason for Visit</label>
                <input
                  type="text"
                  value={apptForm.reason}
                  onChange={(e) => setApptForm({ ...apptForm, reason: e.target.value })}
                  placeholder="e.g. Annual Vaccination, Fever & Cough Checkup"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowApptModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Booking...' : 'Book Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG MEDICAL RECORD & VACCINE MODAL */}
      {showMedicalModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-extrabold text-base text-stone-100 flex items-center gap-2">
                <Syringe className="w-5 h-5 text-emerald-400" />
                Log Medical Diagnosis & Vaccine
              </h3>
              <button onClick={() => setShowMedicalModal(false)} className="text-stone-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateMedicalRecord} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-300 font-medium mb-1">Select Pet *</label>
                <select
                  value={medicalForm.pet_id}
                  onChange={(e) => setMedicalForm({ ...medicalForm, pet_id: Number(e.target.value) })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-emerald-500"
                >
                  {pets.map((p) => (
                    <option key={p.pet_id} value={p.pet_id}>
                      {p.name} ({p.breed_name} - {p.species})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-300 font-medium mb-1">Clinical Diagnosis / Symptoms *</label>
                <textarea
                  required
                  rows={3}
                  value={medicalForm.diagnosis}
                  onChange={(e) => setMedicalForm({ ...medicalForm, diagnosis: e.target.value })}
                  placeholder="e.g. Healthy weight, mild fever treated with antibiotics, ear mites cleared."
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-medium mb-1">Vaccine Given (Optional)</label>
                <input
                  type="text"
                  value={medicalForm.vaccine_given}
                  onChange={(e) => setMedicalForm({ ...medicalForm, vaccine_given: e.target.value })}
                  placeholder="e.g. Rabies Vaccine, Tricat Trio Vaccine, DHPPi"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-medium mb-1">Treatment Date *</label>
                  <input
                    type="date"
                    required
                    value={medicalForm.treatment_date}
                    onChange={(e) => setMedicalForm({ ...medicalForm, treatment_date: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 font-medium mb-1">Update Pet Status</label>
                  <select
                    value={medicalForm.update_pet_status}
                    onChange={(e) => setMedicalForm({ ...medicalForm, update_pet_status: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="none">Keep Current Status</option>
                    <option value="Available">Mark as Available</option>
                    <option value="Under Treatment">Mark as Under Treatment</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMedicalModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Medical Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER VET DOCTOR MODAL */}
      {showVetModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-extrabold text-base text-stone-100 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-400" />
                Register Veterinarian Doctor
              </h3>
              <button onClick={() => setShowVetModal(false)} className="text-stone-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateVet} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-300 font-medium mb-1">Doctor Name *</label>
                <input
                  type="text"
                  required
                  value={vetForm.doctor_name}
                  onChange={(e) => setVetForm({ ...vetForm, doctor_name: e.target.value })}
                  placeholder="e.g. Dr. Ayesha Khan"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-medium mb-1">Specialization</label>
                <input
                  type="text"
                  value={vetForm.specialization}
                  onChange={(e) => setVetForm({ ...vetForm, specialization: e.target.value })}
                  placeholder="e.g. Veterinary Surgeon, Feline Specialist"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={vetForm.phone}
                  onChange={(e) => setVetForm({ ...vetForm, phone: e.target.value })}
                  placeholder="e.g. 01555555555"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-medium mb-1">Clinic Address</label>
                <textarea
                  rows={2}
                  value={vetForm.clinic_address}
                  onChange={(e) => setVetForm({ ...vetForm, clinic_address: e.target.value })}
                  placeholder="e.g. Pet Life Clinic, Banani, Dhaka"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-3 border-t border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVetModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Register Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
