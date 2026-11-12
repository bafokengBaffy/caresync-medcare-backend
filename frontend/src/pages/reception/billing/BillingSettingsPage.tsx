import { useState } from 'react';
import {
  Settings,
  Save,
  Loader2,
  CheckCircle2,
  CreditCard,
  Percent,
  Hash,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

const BillingSettingsPage = () => {
  type BillingSettings = {
    taxRate: number;
    invoicePrefix: string;
    invoiceNextNumber: number;
    dueDays: number;
    enableStripe: boolean;
    enableCash: boolean;
    enableInsurance: boolean;
  };
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [settings, setSettings] = useState({
    taxRate: 5.0,
    invoicePrefix: 'INV-',
    invoiceNextNumber: 1001,
    dueDays: 14,
    enableStripe: true,
    enableCash: true,
    enableInsurance: true,
  });

  const handleChange = <K extends keyof BillingSettings>(field: K, value: BillingSettings[K]) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((res) => setTimeout(res, 1000));
    setSaveSuccess(true);
    setIsSaving(false);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b border-gray-200 px-6 py-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="w-6 h-6 text-indigo-600" />
              Billing Settings
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Configure tax rules, invoice numbering, and payment gateways.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="text-sm font-medium text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Saved
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}{' '}
              Save Settings
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Tax & Invoicing */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Percent className="w-5 h-5 text-indigo-500" /> Tax & Invoicing
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={settings.taxRate}
                onChange={(e) => handleChange('taxRate', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Terms (Days)
              </label>
              <input
                type="number"
                value={settings.dueDays}
                onChange={(e) => handleChange('dueDays', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Prefix</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={settings.invoicePrefix}
                  onChange={(e) => handleChange('invoicePrefix', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Next Invoice Number
              </label>
              <input
                type="number"
                value={settings.invoiceNextNumber}
                onChange={(e) => handleChange('invoiceNextNumber', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg sm:text-sm"
              />
            </div>
          </div>
        </section>

        {/* Payment Methods */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-500" /> Payment Methods
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {(
              [
                {
                  key: 'enableStripe',
                  label: 'Credit/Debit Card (Stripe)',
                  desc: 'Accept online payments via Stripe gateway.',
                },
                {
                  key: 'enableCash',
                  label: 'Cash Payments',
                  desc: 'Allow front-desk staff to record cash payments.',
                },
                {
                  key: 'enableInsurance',
                  label: 'Insurance Billing',
                  desc: 'Process claims through integrated insurance providers.',
                },
              ] as const
            ).map((method) => (
              <div
                key={method.key}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{method.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{method.desc}</p>
                </div>
                <button
                  onClick={() => handleChange(method.key, !settings[method.key])}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings[method.key] ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings[method.key] ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Security Notice */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-amber-900">PCI-DSS Compliance Notice</h3>
            <p className="text-sm text-amber-800 mt-1">
              Do not enter Stripe secret keys directly into this UI in production. Configure them
              via environment variables on the Render backend. This UI only toggles feature flags.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSettingsPage;
