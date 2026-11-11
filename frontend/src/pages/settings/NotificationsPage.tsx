import { useState } from 'react';
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Save,
  Loader2,
  CheckCircle2
} from 'lucide-react';

const NotificationsPage = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [preferences, setPreferences] = useState({
    appointmentReminders: { email: true, sms: true, inApp: true },
    newPatientAssignments: { email: true, sms: false, inApp: true },
    billingUpdates: { email: true, sms: false, inApp: false },
    systemAlerts: { email: true, sms: false, inApp: true },
    marketingEmails: { email: false, sms: false, inApp: false },
  });

  const handleToggle = (category: keyof typeof preferences, channel: 'email' | 'sms' | 'inApp') => {
    setPreferences(prev => ({
      ...prev,
      [category]: { ...prev[category], [channel]: !prev[category][channel] }
    }));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const categories = [
    { key: 'appointmentReminders', label: 'Appointment Reminders', desc: 'Get notified about upcoming patient appointments.' },
    { key: 'newPatientAssignments', label: 'New Patient Assignments', desc: 'When a new patient is assigned to your care.' },
    { key: 'billingUpdates', label: 'Billing & Invoices', desc: 'Payment received, invoice overdue, etc.' },
    { key: 'systemAlerts', label: 'System Alerts', desc: 'Critical security and maintenance notifications.' },
    { key: 'marketingEmails', label: 'Product Updates & Marketing', desc: 'New features and CareSync news.' },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600" />
            Notification Preferences
          </h1>
          <p className="mt-1 text-sm text-gray-500">Control how and when you receive alerts from CareSync.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Event Notifications</h2>
            <div className="flex gap-4 text-xs font-medium text-gray-500">
              <span className="flex items-center gap-1 w-12 justify-center"><Mail className="w-3.5 h-3.5" /> Email</span>
              <span className="flex items-center gap-1 w-12 justify-center"><Smartphone className="w-3.5 h-3.5" /> SMS</span>
              <span className="flex items-center gap-1 w-12 justify-center"><MessageSquare className="w-3.5 h-3.5" /> In-App</span>
            </div>
          </div>
          
          <ul className="divide-y divide-gray-100">
            {categories.map(cat => (
              <li key={cat.key} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50">
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">{cat.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{cat.desc}</p>
                </div>
                <div className="flex gap-4">
                  {/* Email Toggle */}
                  <button onClick={() => handleToggle(cat.key, 'email')} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${preferences[cat.key].email ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${preferences[cat.key].email ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                  {/* SMS Toggle */}
                  <button onClick={() => handleToggle(cat.key, 'sms')} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${preferences[cat.key].sms ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${preferences[cat.key].sms ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                  {/* In-App Toggle */}
                  <button onClick={() => handleToggle(cat.key, 'inApp')} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${preferences[cat.key].inApp ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${preferences[cat.key].inApp ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end items-center gap-3">
            {saveSuccess && <span className="text-sm font-medium text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Preferences saved</span>}
            <button onClick={handleSave} disabled={isSaving} className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;