import { useState } from 'react';
import {
  BarChart3,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

const FinancialReportsPage = () => {
  const [dateRange, setDateRange] = useState('THIS_MONTH');

  // Mock Data
  const kpis = {
    totalRevenue: 45250.0,
    outstandingBalance: 8450.0,
    netProfit: 31200.0,
    avgInvoiceValue: 215.5,
  };

  const revenueByCategory = [
    { name: 'Consultations', amount: 22500, percentage: 50, color: 'bg-indigo-500' },
    { name: 'Laboratory', amount: 11250, percentage: 25, color: 'bg-emerald-500' },
    { name: 'Imaging', amount: 8500, percentage: 19, color: 'bg-blue-500' },
    { name: 'Procedures', amount: 3000, percentage: 6, color: 'bg-amber-500' },
  ];

  const agingReport = [
    { bucket: '0-30 Days', amount: 5000, count: 12, risk: 'Low' },
    { bucket: '31-60 Days', amount: 2000, count: 5, risk: 'Medium' },
    { bucket: '61-90 Days', amount: 1200, count: 3, risk: 'High' },
    { bucket: '90+ Days', amount: 250, count: 1, risk: 'Critical' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
              Financial Reports
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Analyze revenue, outstanding balances, and aging invoices.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="rounded-md border-gray-300 text-sm py-2 pl-3 pr-8 border shadow-sm"
            >
              <option value="THIS_MONTH">This Month</option>
              <option value="LAST_MONTH">Last Month</option>
              <option value="THIS_QUARTER">This Quarter</option>
              <option value="THIS_YEAR">This Year</option>
            </select>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Download className="w-4 h-4 mr-2" /> Export PDF
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${kpis.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-emerald-600 mt-4 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +12.5% vs last period
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Outstanding</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${kpis.outstandingBalance.toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-red-600 mt-4 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +2.1% vs last period
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Net Profit</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${kpis.netProfit.toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-indigo-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4 flex items-center gap-1">
              After estimated expenses
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg. Invoice Value</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${kpis.avgInvoiceValue.toFixed(2)}
                </p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <PieChart className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-emerald-600 mt-4 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +5.4% vs last period
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Revenue by Category</h2>
            <div className="space-y-4">
              {revenueByCategory.map((cat) => (
                <div key={cat.name}>
                  <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                    <span>{cat.name}</span>
                    <span>
                      ${cat.amount.toLocaleString()} ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${cat.color}`}
                      style={{ width: `${cat.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Aging Report */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" /> Accounts Receivable Aging
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Age
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Invoices
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Risk
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {agingReport.map((age) => (
                    <tr key={age.bucket}>
                      <td className="px-3 py-3 text-sm font-medium text-gray-900">{age.bucket}</td>
                      <td className="px-3 py-3 text-sm text-gray-500">{age.count}</td>
                      <td className="px-3 py-3 text-sm font-bold text-gray-900">
                        ${age.amount.toLocaleString()}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            age.risk === 'Low'
                              ? 'bg-emerald-100 text-emerald-800'
                              : age.risk === 'Medium'
                                ? 'bg-amber-100 text-amber-800'
                                : age.risk === 'High'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {age.risk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialReportsPage;
