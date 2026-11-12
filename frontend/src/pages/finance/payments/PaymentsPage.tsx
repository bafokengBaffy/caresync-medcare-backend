import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Loader2,
  Search,
} from 'lucide-react';
import { format } from 'date-fns';
import { usePayments } from '@/hooks/use-payments';

const PAGE_SIZE = 20;

const PaymentsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, error } = usePayments({ page, size: PAGE_SIZE });
  const payments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return (data?.content ?? []).filter((payment) =>
      !query || payment.id.toLowerCase().includes(query) || payment.invoiceId.toLowerCase().includes(query)
    );
  }, [data?.content, searchQuery]);

  const getMethodIcon = (method: string) => {
    if (method === 'CASH') return <DollarSign className="h-4 w-4 text-emerald-600" />;
    return <CreditCard className="h-4 w-4 text-indigo-600" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-gray-200 bg-white px-6 py-8 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
            <CreditCard className="h-6 w-6 text-indigo-600" />
            Payments Ledger
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Recorded payments from the billing database.</p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-6">
        <div className="relative mb-5 max-w-xl">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            aria-label="Search payments"
            placeholder="Search by payment or invoice ID"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>

        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-800 dark:bg-gray-900">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-gray-600 dark:text-gray-300">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading payments…
            </div>
          ) : isError ? (
            <div role="alert" className="p-8 text-center text-red-700 dark:text-red-300">
              Unable to load payments: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          ) : payments.length === 0 ? (
            <p className="p-12 text-center text-gray-500 dark:text-gray-400">
              {searchQuery ? 'No payments match your search.' : 'No payments have been recorded.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {['Payment ID', 'Invoice', 'Amount', 'Method', 'Status', 'Date'].map((heading) => (
                      <th key={heading} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-gray-900 dark:text-gray-100">{payment.id}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <Link className="text-indigo-600 hover:underline dark:text-indigo-400" to={`/finance/invoices/${payment.invoiceId}`}>
                          {payment.invoiceId}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {new Intl.NumberFormat(undefined, { style: 'currency', currency: payment.currency }).format(payment.amountCents / 100)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        <span className="flex items-center gap-2">{getMethodIcon(payment.method)}{payment.method.replace('_', ' ')}</span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                          {payment.status === 'RECORDED' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {payment.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {payment.paidAt ? format(new Date(payment.paidAt), 'MMM d, yyyy HH:mm') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!isLoading && !isError && data && data.total > PAGE_SIZE && (
            <footer className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-800">
              <span className="text-sm text-gray-500 dark:text-gray-400">{data.total} payments</span>
              <div className="flex gap-2">
                <button type="button" disabled={page === 0} onClick={() => setPage((current) => current - 1)} aria-label="Previous page" className="rounded border p-2 disabled:opacity-40 dark:border-gray-700">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button type="button" disabled={(page + 1) * PAGE_SIZE >= data.total} onClick={() => setPage((current) => current + 1)} aria-label="Next page" className="rounded border p-2 disabled:opacity-40 dark:border-gray-700">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </footer>
          )}
        </section>
      </main>
    </div>
  );
};

export default PaymentsPage;
