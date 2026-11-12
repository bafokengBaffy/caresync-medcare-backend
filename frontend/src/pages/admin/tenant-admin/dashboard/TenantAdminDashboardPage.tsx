import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  Activity,
  CreditCard,
  ArrowUpRight,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  UserPlus,
  FileText,
  Shield,
  BarChart3,
  Loader2,
} from 'lucide-react';

import api from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface TenantDashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalPatients: number;
  appointmentsToday: number;
  appointmentsThisMonth: number;
  outstandingInvoicesCents: number;
  paidInvoicesCents: number;
  pendingRegistrations: number;
}

interface RecentActivity {
  id: string;
  action: string;
  actorEmail: string;
  resourceType: string;
  createdAt: string;
}

interface TenantDashboardResponse {
  stats: TenantDashboardStats;
  recentActivity: RecentActivity[];
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function TenantAdminDashboardPage() {
  const user = useAuthStore((state) => state.user);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['tenant-admin-dashboard', user?.tenantId],
    queryFn: async () => {
      const response = await api.get('/api/v1/tenant/dashboard');
      return response.data.data as TenantDashboardResponse;
    },
    enabled: !!user?.tenantId,
    refetchInterval: 60000, // Refresh every minute
  });

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat('en-LS', { style: 'currency', currency: 'LSL' }).format(cents / 100);

  if (!user?.tenantId) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Tenant Assigned</AlertTitle>
        <AlertDescription>Your account is not associated with a tenant. Contact a platform administrator.</AlertDescription>
      </Alert>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Dashboard</AlertTitle>
        <AlertDescription>{error?.message || 'Could not load tenant metrics.'}</AlertDescription>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            Tenant Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time operational overview for your clinic.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* KPI Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Total Users"
              value={data.stats.totalUsers.toString()}
              subValue={`${data.stats.activeUsers} active`}
              icon={Users}
              color="text-blue-600"
              href="/admin/tenant/users"
            />
            <MetricCard
              label="Total Patients"
              value={data.stats.totalPatients.toLocaleString()}
              subValue="All time"
              icon={UserPlus}
              color="text-emerald-600"
              href="/patients"
            />
            <MetricCard
              label="Appointments Today"
              value={data.stats.appointmentsToday.toString()}
              subValue={`${data.stats.appointmentsThisMonth} this month`}
              icon={Calendar}
              color="text-purple-600"
              href="/appointments"
            />
            <MetricCard
              label="Outstanding Invoices"
              value={formatCurrency(data.stats.outstandingInvoicesCents)}
              subValue={`${formatCurrency(data.stats.paidInvoicesCents)} paid`}
              icon={CreditCard}
              color="text-amber-600"
              href="/billing/invoices"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> Recent Activity
                </CardTitle>
                <CardDescription>Latest actions taken by your team.</CardDescription>
              </CardHeader>
              <CardContent>
                {data.recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-3 text-sm text-muted-foreground">No recent activity.</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {data.recentActivity.slice(0, 8).map((activity) => (
                      <li key={activity.id} className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Activity className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">{activity.actorEmail}</span> performed{' '}
                            <span className="font-medium">{activity.action}</span> on{' '}
                            <span className="font-medium">{activity.resourceType}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <QuickAction icon={UserPlus} label="Add Staff Member" href="/admin/tenant/users/new" />
                <QuickAction icon={Users} label="Manage Users" href="/admin/tenant/users" />
                <QuickAction icon={Shield} label="Review Pending Approvals" href="/admin/tenant/registration/approvals" />
                <QuickAction icon={FileText} label="View Audit Log" href="/admin/tenant/audit" />
                <QuickAction icon={BarChart3} label="Staff Reports" href="/admin/tenant/reports" />
              </CardContent>
            </Card>
          </div>

          {/* Pending Registrations Alert */}
          {data.stats.pendingRegistrations > 0 && (
            <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950">
              <Clock className="h-4 w-4 text-amber-600" />
              <AlertTitle>Pending Approvals</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>You have {data.stats.pendingRegistrations} pending registration requests awaiting review.</span>
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/tenant/registration/patients">
                    Review Now <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────
function MetricCard({
  label,
  value,
  subValue,
  icon: Icon,
  color,
  href,
}: {
  label: string;
  value: string;
  subValue: string;
  icon: React.ElementType;
  color: string;
  href: string;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">{subValue}</span>
          <Link to={href} className="text-xs text-primary hover:underline flex items-center gap-0.5">
            View <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({ icon: Icon, label, href }: { icon: React.ElementType; label: string; href: string }) {
  return (
    <Link
      to={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors border"
    >
      <Icon className="h-4 w-4 text-primary" />
      {label}
    </Link>
  );
}