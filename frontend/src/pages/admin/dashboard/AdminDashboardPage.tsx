import { useEffect, useState } from "react";
import { 
  Users, 
  CalendarCheck, 
  CreditCard, 
  Activity, 
  ShieldAlert,
  Server,
  RefreshCw
} from "lucide-react";
import api from "../../../lib/api-client";

// --- Types ---
interface DashboardStats {
  totalPatients: number;
  totalAppointments: number;
  totalRevenue: number;
  systemStatus: "healthy" | "degraded" | "down";
  recentAuditLogs: AuditLogEntry[];
}

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  timestamp: string;
  actorEmail: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Assuming your gateway aggregates or proxies this
      // You may need to change this endpoint based on your Spring Boot Gateway routes
      const response = await api.get<DashboardStats>("/api/admin/dashboard/stats");
      setStats(response.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-500" />
        <span className="ml-3 text-lg font-medium text-slate-600">Loading Dashboard...</span>
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <ShieldAlert className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Access Error</h2>
        <p className="mt-2 text-slate-500">{error}</p>
        <button
          onClick={loadDashboardData}
          className="mt-6 flex items-center rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Administration</h1>
          <p className="text-sm text-slate-500">Monitor platform health, revenue, and security.</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <RefreshCw className="mr-2 h-4 w-4 text-slate-500" />
          Refresh Data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Patients */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Patients</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats?.totalPatients || 0}</p>
            </div>
            <div className="rounded-full bg-blue-50 p-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Card 2: Appointments */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Appointments</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats?.totalAppointments || 0}</p>
            </div>
            <div className="rounded-full bg-green-50 p-3">
              <CalendarCheck className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Card 3: Revenue */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Revenue</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                ${stats?.totalRevenue?.toLocaleString() || 0}
              </p>
            </div>
            <div className="rounded-full bg-purple-50 p-3">
              <CreditCard className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Card 4: System Status */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">System Health</p>
              <div className="mt-2 flex items-center">
                <span
                  className={`mr-2 h-3 w-3 rounded-full ${
                    stats?.systemStatus === "healthy"
                      ? "bg-green-500"
                      : stats?.systemStatus === "degraded"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                />
                <p className="text-xl font-bold capitalize text-slate-900">
                  {stats?.systemStatus || "Unknown"}
                </p>
              </div>
            </div>
            <div className="rounded-full bg-slate-50 p-3">
              <Server className="h-6 w-6 text-slate-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Section (OWASP Requirement for Traceability) */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="flex items-center text-lg font-semibold text-slate-900">
            <Activity className="mr-2 h-5 w-5 text-slate-500" />
            Recent Security Activity
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">Action</th>
                <th className="px-6 py-3 font-medium">Entity</th>
                <th className="px-6 py-3 font-medium">Actor</th>
                <th className="px-6 py-3 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {stats?.recentAuditLogs?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                    No recent activity found.
                  </td>
                </tr>
              ) : (
                stats?.recentAuditLogs?.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{log.action}</td>
                    <td className="px-6 py-4">{log.entityType}</td>
                    <td className="px-6 py-4">{log.actorEmail}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}