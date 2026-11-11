import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  User,
  Mail,
  Globe,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

const TenantCreatePage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // Step 1: Organization
    name: '',
    subdomain: '',
    // Step 2: Owner
    ownerName: '',
    ownerEmail: '',
    // Step 3: Plan
    plan: 'FREE'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.name || !formData.subdomain) return 'Organization name and subdomain are required.';
      if (!/^[a-z0-9-]+$/.test(formData.subdomain)) return 'Subdomain can only contain lowercase letters, numbers, and hyphens.';
    }
    if (step === 2) {
      if (!formData.ownerName || !formData.ownerEmail) return 'Owner name and email are required.';
      if (!/^\S+@\S+\.\S+$/.test(formData.ownerEmail)) return 'Please enter a valid email address.';
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError(null);
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error('Failed to create tenant');
      
      navigate('/admin/tenants');
    } catch (err: any) {
      setError(err.message || 'An error occurred during creation.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded z-0"></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 rounded z-0 transition-all duration-300" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
            
            {[1, 2, 3].map((i) => (
              <div key={i} className="relative z-10 flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                  step >= i ? 'bg-indigo-600 text-white' : 'bg-white text-gray-400 border-2 border-gray-200'
                }`}>
                  {step > i ? <CheckCircle2 className="w-5 h-5" /> : i}
                </div>
                <span className={`mt-2 text-xs font-medium ${step >= i ? 'text-indigo-700' : 'text-gray-500'}`}>
                  {i === 1 ? 'Organization' : i === 2 ? 'Owner' : 'Plan'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-8 sm:p-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {step === 1 ? 'Create New Tenant' : step === 2 ? 'Assign Owner' : 'Select Plan'}
            </h2>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Step 1: Organization */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Organization Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. City Health Clinic" className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subdomain</label>
                  <div className="flex rounded-lg shadow-sm">
                    <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                      <Globe className="h-4 w-4 mr-2" />
                      https://
                    </span>
                    <input name="subdomain" value={formData.subdomain} onChange={handleChange} placeholder="city-health" className="flex-1 min-w-0 block w-full px-3 py-3 border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    <span className="inline-flex items-center px-4 rounded-r-lg border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                      .caresync.com
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Owner */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Owner Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input name="ownerName" value={formData.ownerName} onChange={handleChange} placeholder="Dr. Jane Doe" className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Owner Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input name="ownerEmail" type="email" value={formData.ownerEmail} onChange={handleChange} placeholder="admin@cityhealth.com" className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">An invitation email will be sent here to set up the admin password.</p>
                </div>
              </div>
            )}

            {/* Step 3: Plan */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                {['FREE', 'PRO', 'ENTERPRISE'].map((p) => (
                  <label key={p} className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${
                    formData.plan === p ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${formData.plan === p ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {p === 'FREE' ? <User className="w-5 h-5" /> : p === 'PRO' ? <ShieldCheck className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{p} Plan</p>
                        <p className="text-xs text-gray-500">
                          {p === 'FREE' ? 'Up to 5 users, basic features.' : p === 'PRO' ? 'Up to 50 users, advanced analytics.' : 'Unlimited users, priority support.'}
                        </p>
                      </div>
                    </div>
                    <input type="radio" name="plan" value={p} checked={formData.plan === p} onChange={handleChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300" />
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => step > 1 ? setStep(step - 1) : navigate('/admin/tenants')}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {step > 1 ? <><ArrowLeft className="w-4 h-4 mr-2" /> Back</> : 'Cancel'}
            </button>
            <button
              onClick={step === 3 ? handleSubmit : handleNext}
              disabled={isSubmitting}
              className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {step === 3 ? 'Create Tenant' : 'Continue'}
              {step !== 3 && <ArrowRight className="w-4 h-4 ml-2" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantCreatePage;