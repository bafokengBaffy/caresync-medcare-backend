import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
  DollarSign,
  User,
  Calendar,
} from 'lucide-react';
import { useInvoice, useUpdateInvoice } from '@/hooks/use-invoices';
import type { InvoiceEditorPayload } from '@/types/invoice';
import { errorMessage } from '@/lib/error-message';

type InvoiceFormItem = InvoiceEditorPayload['items'][number];
type InvoiceFormData = Omit<InvoiceEditorPayload, 'items'> & { items: InvoiceFormItem[] };

const InvoiceEditPage = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { data: invoice, isLoading: isLoadingInvoice } = useInvoice(invoiceId!);
  const updateMutation = useUpdateInvoice();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<InvoiceFormData>({
    patientId: '',
    dueDate: '',
    taxRate: 5,
    notes: '',
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
  });

  useEffect(() => {
    if (invoice) {
      const normalizedItems = (invoice.items ?? invoice.lineItems ?? []).map((item) => ({
        description: item.description ?? '',
        quantity: Number(item.quantity ?? 1),
        unitPrice: Number(item.unitPrice ?? ((item.unitPriceCents ?? 0) / 100)),
      }));

      setFormData({
        patientId: invoice.patientId || '',
        dueDate: invoice.dueDate ? invoice.dueDate.split('T')[0] : '',
        taxRate: invoice.taxRate || 5,
        notes: invoice.notes || '',
        items: normalizedItems.length ? normalizedItems : [{ description: '', quantity: 1, unitPrice: 0 }],
      });
    }
  }, [invoice]);

  const handleAddItem = () => setFormData(prev => ({ ...prev, items: [...prev.items, { description: '', quantity: 1, unitPrice: 0 }] }));
  const handleRemoveItem = (index: number) => { if (formData.items.length > 1) setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) })); };
  const handleItemChange = (index: number, field: keyof InvoiceFormItem, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = field === 'description'
      ? { ...newItems[index], description: String(value) }
      : { ...newItems[index], [field]: Number(value) };
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const tax = (subtotal * formData.taxRate) / 100;
  const total = subtotal + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || !formData.dueDate) { setError('Patient and due date are required.'); return; }

    updateMutation.mutate({ id: invoiceId!, data: formData }, {
      onSuccess: () => navigate(`/reception/billing/invoices/${invoiceId}`),
      onError: (err: unknown) => setError(errorMessage(err, 'Failed to update invoice.'))
    });
  };

  if (isLoadingInvoice) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-200 rounded-full"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Invoice</h1>
            <p className="text-sm text-gray-500 mt-1">Update billing details for {invoice?.invoiceNumber}.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3"><AlertCircle className="w-5 h-5 text-red-600 mt-0.5" /><p className="text-sm text-red-700">{error}</p></div>}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Billing Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" value={formData.patientId} onChange={(e) => setFormData({...formData, patientId: e.target.value})} required className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="date" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} required className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
              <button type="button" onClick={handleAddItem} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"><Plus className="w-4 h-4" /> Add Item</button>
            </div>
            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex-1 w-full">
                    <input type="text" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} placeholder="Description" className="w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm" />
                  </div>
                  <div className="w-full sm:w-24">
                    <input type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)} placeholder="Qty" className="w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm" />
                  </div>
                  <div className="w-full sm:w-32">
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)} placeholder="Price" className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md sm:text-sm" />
                    </div>
                  </div>
                  <button type="button" onClick={() => handleRemoveItem(index)} disabled={formData.items.length === 1} className="p-2 text-gray-400 hover:text-red-600 rounded disabled:opacity-30"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200 flex flex-col items-end space-y-2">
              <div className="flex justify-between w-full sm:w-64 text-sm text-gray-600"><span>Subtotal:</span><span className="font-medium">${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between w-full sm:w-64 text-sm text-gray-600"><span>Tax ({formData.taxRate}%):</span><span className="font-medium">${tax.toFixed(2)}</span></div>
              <div className="flex justify-between w-full sm:w-64 text-lg font-bold text-gray-900 pt-2 border-t border-gray-200"><span>Total:</span><span className="text-indigo-600">${total.toFixed(2)}</span></div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate(-1)} className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={updateMutation.isPending} className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceEditPage;
