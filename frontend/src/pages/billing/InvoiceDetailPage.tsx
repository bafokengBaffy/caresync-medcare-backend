import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Download,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  CreditCard,
  Loader2,
  Calendar,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { useInvoice } from '@/hooks/use-invoices';

const InvoiceDetailPage = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { data: invoice, isLoading, isError } = useInvoice(invoiceId!);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  if (isError || !invoice) return <div className="min-h-screen flex flex-col items-center justify-center text-red-500"><AlertTriangle className="w-12 h-12 mb-4" /><p>Invoice not found</p></div>;

  const subtotal = invoice.items?.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0) || 0;
  const tax = invoice.taxAmount || 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6 sticky top-0 z-10 print:hidden">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/invoices')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Invoice {invoice.invoiceNumber}</h1>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Issued: {format(new Date(invoice.createdAt), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Printer className="w-4 h-4 mr-2" /> Print
            </button>
            {invoice.status !== 'PAID' && (
              <button onClick={() => setIsPayModalOpen(true)} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700">
                <CreditCard className="w-4 h-4 mr-2" /> Record Payment
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Document Body */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 print:shadow-none print:border-none print:p-0">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b border-gray-200 pb-8 mb-8">
            <div>
              <h2 className="text-2xl font-black text-indigo-600 tracking-tight">CARESYNC MEDCARE</h2>
              <p className="text-xs text-gray-500 mt-1">123 Health Ave, Medical City</p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {invoice.status === 'PAID' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                {invoice.status}
              </span>
            </div>
          </div>

          {/* Bill To */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Billed To</h3>
              <p className="text-sm font-bold text-gray-900">{invoice.patientName || 'Unknown Patient'}</p>
              <p className="text-sm text-gray-600 mt-1">ID: {invoice.patientId}</p>
            </div>
            <div className="text-right">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Details</h3>
              <p className="text-sm text-gray-900"><span className="font-medium">Due Date:</span> {invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM d, yyyy') : 'N/A'}</p>
              <p className="text-sm text-gray-900 mt-1"><span className="font-medium">Invoice #:</span> {invoice.invoiceNumber}</p>
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="text-right py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="text-right py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                <th className="text-right py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item: any, i: number) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-3 text-sm text-gray-900">{item.description}</td>
                  <td className="py-3 text-sm text-gray-600 text-right">{item.quantity}</td>
                  <td className="py-3 text-sm text-gray-600 text-right">${item.unitPrice.toFixed(2)}</td>
                  <td className="py-3 text-sm font-medium text-gray-900 text-right">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full sm:w-72 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span className="text-indigo-600">${invoice.totalAmount?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Notes</h4>
              <p className="text-sm text-gray-600">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailPage;