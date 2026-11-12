import { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Loader2,
  Building2,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { format } from 'date-fns';

interface Subscription {
  id: string;
  tenantName: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
  amount: number;
  nextBillingDate: string;
}

const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchSubs = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/v1/admin/billing/subscriptions?search=${searchQuery}`);
        if (res.ok) setSubscriptions(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    const timer = setTimeout(() => fetchSubs(), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'ENTERPRISE': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"><ShieldCheck className="w-3 h-3" /> Enterprise</span>;
      case 'PRO': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Zap className="w-3 h-3" /> Pro</span>;
      default: return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-slate-900 dark:text-slate-100">Free</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col dark:bg-slate-950">
      <div className="bg-white border-b border-gray-200 px-6 py-6 dark:bg-slate-900 dark:border-slate-700">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 dark:text-slate-50">
              <CreditCard className="w-6 h-6 text-indigo-600" />
              Subscription Management
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Manage tenant plans, billing cycles, and subscription statuses.</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 py-8 flex-1 flex flex-col gap-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-300" />
          <input
            type="text"
            placeholder="Search subscriptions by tenant name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-900"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 dark:bg-slate-900 dark:border-slate-700">
          {isLoading ? (
            <div className="p-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
          ) : subscriptions.length === 0 ? (
            <div className="p-16 text-center text-gray-500 dark:text-slate-400">No subscriptions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-950">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">Tenant</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">Plan</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">Billing Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">Next Billing</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-900 dark:divide-slate-700">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-slate-950">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-indigo-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-slate-50">{sub.tenantName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getPlanBadge(sub.plan)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-slate-50">
                        ${sub.amount.toFixed(2)}<span className="text-gray-500 font-normal dark:text-slate-400">/mo</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-gray-400 dark:text-slate-300" />
                          {format(new Date(sub.nextBillingDate), 'MMM d, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ sub.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : sub.status === 'PAST_DUE' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800 dark:text-slate-100' } dark:text-slate-100`}>
                          {sub.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button className="inline-flex items-center text-indigo-600 hover:text-indigo-900 font-medium text-xs bg-indigo-50 px-3 py-1.5 rounded-md hover:bg-indigo-100 transition-colors">
                          Manage <ChevronRight className="w-3 h-3 ml-1" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionsPage;