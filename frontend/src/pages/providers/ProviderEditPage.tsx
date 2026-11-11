import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  User,
  Mail,
  Phone,
  Award,
  Building2,
} from 'lucide-react';
import { useProvider, useUpdateProvider } from '@/hooks/use-providers';
import type { Specialty } from '@/lib/constants';
import type { ProviderUpdatePayload } from '@/types/provider';

const ProviderEditPage = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();
  const { data: provider, isLoading: isLoadingProvider } = useProvider(providerId!);
  const updateMutation = useUpdateProvider();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<{ firstName: string; lastName: string; email: string; phoneNumber: string; specialty: Specialty | ''; licenseNumber: string; npi: string; yearsOfExperience: string; bio: string; }>({
    firstName: '', lastName: '', email: '', phoneNumber: '', specialty: 'DENTAL', licenseNumber: '', npi: '', yearsOfExperience: '', bio: '',
  });

  useEffect(() => {
    if (provider) {
      setFormData({
        firstName: provider.firstName || '',
        lastName: provider.lastName || '',
        email: provider.email || '',
        phoneNumber: provider.phoneNumber || '',
        specialty: provider.specialty || 'DENTAL',
        licenseNumber: provider.licenseNumber || '',
        npi: provider.npi || '',
        yearsOfExperience: provider.yearsOfExperience?.toString() || '',
        bio: provider.bio || '',
      });
    }
  }, [provider]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('First Name, Last Name, and Email are required.');
      return;
    }
    const payload: ProviderUpdatePayload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phoneNumber: formData.phoneNumber.trim() || undefined,
      specialty: formData.specialty || undefined,
      licenseNumber: formData.licenseNumber.trim() || undefined,
      npi: formData.npi.trim() || undefined,
      yearsOfExperience: formData.yearsOfExperience ? Number(formData.yearsOfExperience) : undefined,
      bio: formData.bio.trim() || undefined,
    };
    updateMutation.mutate({ id: providerId!, data: payload }, {
      onSuccess: () => navigate(`/providers/${providerId}`),
      onError: (err: any) => setError(err?.message || 'Failed to update provider.')
    });
  };

  if (isLoadingProvider) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-200 rounded-full"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Provider</h1>
            <p className="text-sm text-gray-500 mt-1">Update details for Dr. {provider?.firstName} {provider?.lastName}.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3"><AlertCircle className="w-5 h-5 text-red-600 mt-0.5" /><p className="text-sm text-red-700">{error}</p></div>}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2"><User className="w-5 h-5 text-indigo-500" /> Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg sm:text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg sm:text-sm" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2"><Award className="w-5 h-5 text-indigo-500" /> Professional Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                <select name="specialty" value={formData.specialty} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg sm:text-sm">
                  <option value="DENTAL">Dental</option>
                  <option value="MENTAL_HEALTH">Mental Health</option>
                  <option value="OPTOMETRY">Optometry</option>
                  <option value="NURSING">Nursing</option>
                  <option value="WELLNESS">Wellness</option>
                  <option value="COMMUNITY">Community</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                <input type="number" min="0" step="1" name="yearsOfExperience" value={formData.yearsOfExperience} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg sm:text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NPI Number</label>
                <input type="text" name="npi" value={formData.npi} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg sm:text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Bio</label>
                <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg sm:text-sm" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate(-1)} className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={updateMutation.isPending} className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Update Provider
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProviderEditPage;
