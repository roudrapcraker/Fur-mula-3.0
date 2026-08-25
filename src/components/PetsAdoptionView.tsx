import React, { useState, useEffect } from 'react';
import { 
  PawPrint, 
  Plus, 
  Search, 
  Filter, 
  Heart, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Edit, 
  Trash2, 
  AlertCircle, 
  Sparkles,
  Info,
  Calendar,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Pet, Adoption, User, Breed } from '../types';
import { api } from '../services/api';

interface PetsAdoptionViewProps {
  pets: Pet[];
  adoptions: Adoption[];
  users: User[];
  breeds: Breed[];
  onRefresh: () => void;
  quickAdoptPetId?: number | null;
}

export const PetsAdoptionView: React.FC<PetsAdoptionViewProps> = ({
  pets = [],
  adoptions = [],
  users = [],
  breeds = [],
  onRefresh,
  quickAdoptPetId
}) => {
  const [activeTab, setActiveTab] = useState<'pets' | 'applications'>('pets');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [speciesFilter, setSpeciesFilter] = useState<string>('ALL');

  // Modals state
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [showApplyAdoptionModal, setShowApplyAdoptionModal] = useState(Boolean(quickAdoptPetId));
  const [editingPet, setEditingPet] = useState<Pet | null>(null);

  // Form states
  const [petForm, setPetForm] = useState({
    name: '',
    age: '',
    gender: 'Female',
    status: 'Available' as 'Available' | 'Adopted' | 'Under Treatment',
    breed_id: breeds[0]?.breed_id || 1,
  });

  const [adoptionForm, setAdoptionForm] = useState({
    user_id: users[0]?.user_id || 1,
    pet_id: quickAdoptPetId || pets.find(p => p.status === 'Available')?.pet_id || pets[0]?.pet_id || 1,
    adoption_date: new Date().toISOString().split('T')[0],
    application_status: 'Pending' as 'Pending' | 'Approved',
  });

  // Keep form IDs fresh when users, breeds, or pets are loaded
  useEffect(() => {
    if (breeds.length > 0 && !petForm.breed_id) {
      setPetForm(prev => ({ ...prev, breed_id: breeds[0].breed_id }));
    }
  }, [breeds]);

  useEffect(() => {
    if (users.length > 0 && (!adoptionForm.user_id || !users.some(u => u.user_id === adoptionForm.user_id))) {
      setAdoptionForm(prev => ({ ...prev, user_id: users[0].user_id }));
    }
    if (pets.length > 0 && (!adoptionForm.pet_id || !pets.some(p => p.pet_id === adoptionForm.pet_id))) {
      const avail = pets.find(p => p.status === 'Available')?.pet_id || pets[0].pet_id;
      setAdoptionForm(prev => ({ ...prev, pet_id: avail }));
    }
  }, [users, pets]);

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filtered pets
  const safePets = pets || [];
  const safeAdoptions = adoptions || [];
  const filteredPets = safePets.filter((pet) => {
    const matchesSearch = pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pet.breed_name && pet.breed_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || pet.status === statusFilter;
    const matchesSpecies = speciesFilter === 'ALL' || (pet.species && pet.species.toLowerCase() === speciesFilter.toLowerCase());
    return matchesSearch && matchesStatus && matchesSpecies;
  });

  // Handle Pet Create/Update
  const handleSavePet = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      if (editingPet) {
        await api.updatePet(editingPet.pet_id, {
          name: petForm.name,
          age: petForm.age ? parseFloat(petForm.age) : undefined,
          gender: petForm.gender,
          status: petForm.status,
          breed_id: Number(petForm.breed_id),
        });
        setFeedback({ type: 'success', message: `Pet ${petForm.name} updated successfully!` });
      } else {
        await api.createPet({
          name: petForm.name,
          age: petForm.age ? parseFloat(petForm.age) : undefined,
          gender: petForm.gender,
          status: petForm.status,
          breed_id: Number(petForm.breed_id),
        });
        setFeedback({ type: 'success', message: `Pet ${petForm.name} added to shelter!` });
      }
      setShowAddPetModal(false);
      setEditingPet(null);
      setPetForm({
        name: '',
        age: '',
        gender: 'Female',
        status: 'Available',
        breed_id: breeds[0]?.breed_id || 1,
      });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Pet Delete
  const handleDeletePet = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the database? (Associated adoptions, appointments, and medical records will be handled by foreign key cascade).`)) {
      return;
    }
    try {
      await api.deletePet(id);
      setFeedback({ type: 'success', message: `Pet ${name} deleted successfully.` });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Handle Adoption Application submission
  const handleApplyAdoption = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      await api.createAdoption({
        user_id: Number(adoptionForm.user_id),
        pet_id: Number(adoptionForm.pet_id),
        adoption_date: adoptionForm.adoption_date,
        application_status: adoptionForm.application_status,
      });

      if (adoptionForm.application_status === 'Approved') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      setFeedback({ 
        type: 'success', 
        message: adoptionForm.application_status === 'Approved' 
          ? 'Adoption approved & pet marked Adopted immediately! 🎉' 
          : 'Adoption application logged and queued for review.' 
      });
      setShowApplyAdoptionModal(false);
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Adoption Status Change
  const handleUpdateAdoptionStatus = async (id: number, status: 'Approved' | 'Rejected') => {
    try {
      await api.updateAdoptionStatus(id, status);
      if (status === 'Approved') {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 }
        });
      }
      setFeedback({
        type: 'success',
        message: status === 'Approved'
          ? 'Adoption approved! Pet status updated to Adopted & other pending requests auto-resolved. 🐾'
          : 'Adoption application rejected.'
      });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleOpenEdit = (pet: Pet) => {
    setEditingPet(pet);
    setPetForm({
      name: pet.name,
      age: pet.age !== undefined && pet.age !== null ? String(pet.age) : '',
      gender: pet.gender || 'Female',
      status: pet.status,
      breed_id: pet.breed_id || breeds[0]?.breed_id || 1,
    });
    setShowAddPetModal(true);
  };

  const handleOpenAdoptForPet = (petId: number) => {
    setAdoptionForm(prev => ({ ...prev, pet_id: petId }));
    setShowApplyAdoptionModal(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Alert / Feedback message */}
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

      {/* Top Controls Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-stone-100">Pet Shelter & Adoption Center</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-medium">
                {pets.length} Animals Registered
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Manage rescue intake, shelter availability status, and automated double-adoption prevention workflow.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingPet(null);
                setPetForm({
                  name: '',
                  age: '',
                  gender: 'Female',
                  status: 'Available',
                  breed_id: breeds[0]?.breed_id || 1,
                });
                setShowAddPetModal(true);
              }}
              id="add-pet-btn"
              className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 text-xs font-semibold border border-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              Add Rescued Pet
            </button>

            <button
              onClick={() => setShowApplyAdoptionModal(true)}
              id="new-adoption-app-btn"
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Heart className="w-4 h-4" />
              New Adoption Request
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex border-b border-stone-800 mt-6 space-x-6 text-sm">
          <button
            onClick={() => setActiveTab('pets')}
            className={`pb-3 font-semibold text-xs flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'pets'
                ? 'text-emerald-400 border-b-2 border-emerald-500'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <PawPrint className="w-4 h-4" />
            Shelter Animals Catalog ({pets.length})
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`pb-3 font-semibold text-xs flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'applications'
                ? 'text-emerald-400 border-b-2 border-emerald-500'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Heart className="w-4 h-4 text-rose-400" />
            Adoption Applications Review ({adoptions.length})
            {adoptions.filter(a => a.application_status === 'Pending').length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/40">
                {adoptions.filter(a => a.application_status === 'Pending').length} Pending
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'pets' ? (
        /* PETS CATALOG VIEW */
        <div className="space-y-4">
          {/* Filters and search bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-stone-900 border border-stone-800 p-3 rounded-2xl">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search pets by name, breed..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-4 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="Available">Available Only</option>
                <option value="Adopted">Adopted Only</option>
                <option value="Under Treatment">Under Treatment</option>
              </select>

              <select
                value={speciesFilter}
                onChange={(e) => setSpeciesFilter(e.target.value)}
                className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">All Species</option>
                <option value="Cat">Cats 🐱</option>
                <option value="Dog">Dogs 🐶</option>
              </select>
            </div>
          </div>

          {/* Pets Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPets.map((pet) => {
              const isAvailable = pet.status === 'Available';
              const isAdopted = pet.status === 'Adopted';
              const isTreatment = pet.status === 'Under Treatment';

              return (
                <div
                  key={pet.pet_id}
                  id={`pet-card-${pet.pet_id}`}
                  className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-stone-700 transition-all"
                >
                  <div>
                    {/* Card Top: Species & Status */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center text-lg">
                          {pet.species === 'Cat' ? '🐱' : pet.species === 'Dog' ? '🐶' : '🐾'}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-base text-stone-100 flex items-center gap-1.5">
                            {pet.name}
                            <span className="text-[10px] text-stone-500 font-mono">#{pet.pet_id}</span>
                          </h3>
                          <p className="text-xs text-emerald-400 font-medium">
                            {pet.breed_name || 'Mixed Breed'} • {pet.species || 'Pet'}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[11px] px-2.5 py-1 rounded-full font-bold border ${
                          isAvailable
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                            : isAdopted
                            ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                            : 'bg-amber-950/80 text-amber-300 border-amber-800'
                        }`}
                      >
                        {pet.status}
                      </span>
                    </div>

                    {/* Stats pills */}
                    <div className="grid grid-cols-3 gap-2 my-3 text-center">
                      <div className="bg-stone-950 border border-stone-800/80 p-2 rounded-xl">
                        <span className="text-[10px] text-stone-500 block">Age</span>
                        <span className="text-xs font-bold text-stone-200">{pet.age ? `${pet.age} yrs` : 'N/A'}</span>
                      </div>
                      <div className="bg-stone-950 border border-stone-800/80 p-2 rounded-xl">
                        <span className="text-[10px] text-stone-500 block">Gender</span>
                        <span className="text-xs font-bold text-stone-200">{pet.gender || 'Unknown'}</span>
                      </div>
                      <div className="bg-stone-950 border border-stone-800/80 p-2 rounded-xl">
                        <span className="text-[10px] text-stone-500 block">Medical</span>
                        <span className="text-xs font-bold text-stone-200">{pet.medical_count || 0} Logs</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(pet)}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition-colors cursor-pointer"
                        title="Edit Pet"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePet(pet.pet_id, pet.name)}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-950 hover:text-rose-400 text-stone-400 text-xs transition-colors cursor-pointer"
                        title="Delete Pet"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {isAvailable ? (
                      <button
                        onClick={() => handleOpenAdoptForPet(pet.pet_id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Heart className="w-3.5 h-3.5" />
                        Apply to Adopt
                      </button>
                    ) : isAdopted ? (
                      <span className="text-xs text-blue-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Adopted
                      </span>
                    ) : (
                      <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> In Treatment
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredPets.length === 0 && (
            <div className="text-center py-12 text-stone-500 bg-stone-900 border border-stone-800 rounded-2xl">
              <PawPrint className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No pets found matching the selected filters.</p>
            </div>
          )}
        </div>
      ) : (
        /* ADOPTION APPLICATIONS REVIEW VIEW */
        <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-stone-850 border-b border-stone-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-100">Adoption Applications & Approval Pipeline</h3>
              <p className="text-xs text-stone-400">
                Approving an application automatically sets the Pet status to "Adopted" and updates the applicant's role.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-stone-800 text-stone-300 font-medium">
              {adoptions.length} Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-950 text-stone-400 uppercase tracking-wider text-[10px] font-bold border-b border-stone-800">
                <tr>
                  <th className="px-4 py-3">App ID</th>
                  <th className="px-4 py-3">Pet Details</th>
                  <th className="px-4 py-3">Applicant Info</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/80">
                {adoptions.map((ad) => {
                  const isPending = ad.application_status === 'Pending';
                  const isApproved = ad.application_status === 'Approved';
                  const isRejected = ad.application_status === 'Rejected';

                  return (
                    <tr key={ad.adoption_id} className="hover:bg-stone-850/60 transition-colors">
                      <td className="px-4 py-3 font-mono text-stone-400 font-bold">#{ad.adoption_id}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-stone-100 flex items-center gap-1.5">
                          <PawPrint className="w-3.5 h-3.5 text-emerald-400" />
                          {ad.pet_name}
                        </div>
                        <div className="text-[11px] text-stone-400">
                          {ad.breed_name} • {ad.species}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-stone-200">{ad.user_name}</div>
                        <div className="text-[11px] text-stone-400">{ad.user_email} • {ad.user_phone}</div>
                        {ad.user_address && (
                          <div className="text-[10px] text-stone-500 truncate max-w-xs">{ad.user_address}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-stone-300 whitespace-nowrap">{ad.adoption_date}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            isApproved
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : isPending
                              ? 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse'
                              : 'bg-stone-800 text-stone-400 border-stone-700'
                          }`}
                        >
                          {isApproved && <CheckCircle2 className="w-3 h-3" />}
                          {isPending && <Clock className="w-3 h-3" />}
                          {isRejected && <XCircle className="w-3 h-3" />}
                          {ad.application_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleUpdateAdoptionStatus(ad.adoption_id, 'Approved')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                              title="Approve adoption application"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Approve
                            </button>
                            <button
                              onClick={() => handleUpdateAdoptionStatus(ad.adoption_id, 'Rejected')}
                              className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-rose-950 hover:text-rose-300 text-stone-300 font-medium text-xs transition-colors cursor-pointer border border-stone-700"
                              title="Reject adoption application"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-stone-500 italic">Decision Finalized</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT PET MODAL */}
      {showAddPetModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-extrabold text-base text-stone-100 flex items-center gap-2">
                <PawPrint className="w-5 h-5 text-emerald-500" />
                {editingPet ? 'Update Pet Record' : 'Register Rescued Pet'}
              </h3>
              <button
                onClick={() => {
                  setShowAddPetModal(false);
                  setEditingPet(null);
                }}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePet} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-300 font-medium mb-1">Pet Name *</label>
                <input
                  type="text"
                  required
                  value={petForm.name}
                  onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
                  placeholder="e.g. Bella, Simba, Charlie"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-medium mb-1">Age (Years)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={petForm.age}
                    onChange={(e) => setPetForm({ ...petForm, age: e.target.value })}
                    placeholder="e.g. 1.5"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 font-medium mb-1">Gender</label>
                  <select
                    value={petForm.gender}
                    onChange={(e) => setPetForm({ ...petForm, gender: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-medium mb-1">Breed & Species *</label>
                <select
                  value={petForm.breed_id}
                  onChange={(e) => setPetForm({ ...petForm, breed_id: Number(e.target.value) })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-emerald-500"
                >
                  {breeds.map((b) => (
                    <option key={b.breed_id} value={b.breed_id}>
                      {b.breed_name} ({b.species})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-300 font-medium mb-1">Shelter Status</label>
                <select
                  value={petForm.status}
                  onChange={(e) => setPetForm({ ...petForm, status: e.target.value as any })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Available">Available (Ready for Adoption)</option>
                  <option value="Adopted">Adopted</option>
                  <option value="Under Treatment">Under Treatment (In Clinic)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPetModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingPet ? 'Update Pet' : 'Register Pet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW ADOPTION REQUEST MODAL */}
      {showApplyAdoptionModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-extrabold text-base text-stone-100 flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" />
                Submit Pet Adoption Request
              </h3>
              <button
                onClick={() => setShowApplyAdoptionModal(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyAdoption} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-300 font-medium mb-1">Select Applicant / Adopter *</label>
                <select
                  value={adoptionForm.user_id}
                  onChange={(e) => setAdoptionForm({ ...adoptionForm, user_id: Number(e.target.value) })}
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
                <label className="block text-stone-300 font-medium mb-1">Select Pet for Adoption *</label>
                <select
                  value={adoptionForm.pet_id}
                  onChange={(e) => setAdoptionForm({ ...adoptionForm, pet_id: Number(e.target.value) })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-emerald-500"
                >
                  {pets.map((p) => (
                    <option key={p.pet_id} value={p.pet_id} disabled={p.status === 'Adopted'}>
                      {p.name} ({p.breed_name} - {p.species}) - Status: {p.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-medium mb-1">Application Date</label>
                  <input
                    type="date"
                    required
                    value={adoptionForm.adoption_date}
                    onChange={(e) => setAdoptionForm({ ...adoptionForm, adoption_date: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 font-medium mb-1">Initial Status</label>
                  <select
                    value={adoptionForm.application_status}
                    onChange={(e) => setAdoptionForm({ ...adoptionForm, application_status: e.target.value as any })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Pending">Pending Review</option>
                    <option value="Approved">Instant Approval & Adopt</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-[11px] text-stone-400">
                <span className="font-semibold text-emerald-400">DBMS Integrity Rule:</span> If approved, this pet will automatically be marked as "Adopted" in the database, and other conflicting pending applications for this pet will be rejected.
              </div>

              <div className="pt-3 border-t border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowApplyAdoptionModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
