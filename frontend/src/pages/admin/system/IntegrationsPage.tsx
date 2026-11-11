import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Link as LinkIcon,
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Loader2,
  AlertCircle,
  Info,
} from 'lucide-react';

import api from '@/lib/api-client';
import { errorMessage } from '@/lib/error-message';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type IntegrationStatus = 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED' | 'UNKNOWN';
type IntegrationCategory = 'AUTH' | 'DATABASE';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  provider: 'Firebase' | 'Supabase';
  version?: string;
  region?: string;
  endpoint?: string;
  lastChecked: string;
  latencyMs: number | null;
  docsUrl: string | null;
}

const STATUS_STYLES: Record<IntegrationStatus, string> = {
  CONNECTED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  DEGRADED: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  DISCONNECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  UNKNOWN: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

const STATUS_ICONS: Record<IntegrationStatus, React.ElementType> = {
  CONNECTED: CheckCircle2,
  DEGRADED: AlertTriangle,
  DISCONNECTED: XCircle,
  UNKNOWN: AlertCircle,
};

const CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  AUTH: 'Authentication',
  DATABASE: 'Database',
};

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function IntegrationsPage() {
  // Fetch Integration Status
  const {
    data: integrationsData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['system-integrations'],
    queryFn: async () => {
      const response = await api.get('/api/v1/admin/integrations/status');
      return response.data as Integration[];
    },
    refetchInterval: 30000, // Auto-refresh every 30s
    staleTime: 10000,
  });

  // Test Connection Mutation
  const [testingId, setTestingId] = useState<string | null>(null);

  const handleTestConnection = async (integration: Integration) => {
    setTestingId(integration.id);
    try {
      const response = await api.post(`/api/v1/admin/integrations/${integration.id}/test`);
      if (response.data.status === 'CONNECTED') {
        toast.success(`${integration.name} connection verified.`);
      } else {
        toast.warning(`${integration.name} connection check returned: ${response.data.status}`);
      }
      refetch();
    } catch (err: unknown) {
      toast.error(errorMessage(err, `Failed to test ${integration.name}.`));
    } finally {
      setTestingId(null);
    }
  };

  const integrations = integrationsData || [];
  const summary = {
    total: integrations.length,
    connected: integrations.filter((i) => i.status === 'CONNECTED').length,
    degraded: integrations.filter((i) => i.status === 'DEGRADED').length,
    disconnected: integrations.filter((i) => i.status === 'DISCONNECTED').length,
  };

  if (isError) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Integrations</AlertTitle>
            <AlertDescription>{errorMessage(error, 'Could not retrieve integration status.')}</AlertDescription>
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
            <LinkIcon className="h-8 w-8 text-primary" />
            System Integrations
          </h1>
          <p className="text-muted-foreground mt-1">
            Live connectivity checks for the application database and Firebase Authentication.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Refreshing...' : 'Refresh All'}
          </Button>
        </div>
      </div>

      {/* Summary Strip */}
      {!isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase">Total Services</p>
              <p className="text-2xl font-bold mt-1">{summary.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase">Connected</p>
              <p className="text-2xl font-bold mt-1 text-emerald-600">{summary.connected}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase">Degraded</p>
              <p className="text-2xl font-bold mt-1 text-amber-600">{summary.degraded}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase">Disconnected</p>
              <p className="text-2xl font-bold mt-1 text-red-600">{summary.disconnected}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Integration Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : integrations.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <LinkIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">No integrations configured.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrations.map((integration) => {
            const StatusIcon = STATUS_ICONS[integration.status];
            const ProviderIcon = integration.category === 'AUTH' ? LinkIcon : LinkIcon;
            const isTesting = testingId === integration.id;
            return (
              <Card key={integration.id} className="flex flex-col">
                <CardContent className="p-6 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-muted">
                        <ProviderIcon className="h-5 w-5 text-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{integration.name}</h3>
                        <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[integration.category]}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`${STATUS_STYLES[integration.status]} border-none`}>
                      <StatusIcon className="h-3 w-3 mr-1" /> {integration.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{integration.description}</p>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    {integration.region && <p><span className="font-medium">Region:</span> {integration.region}</p>}
                    {integration.version && <p><span className="font-medium">Version:</span> {integration.version}</p>}
                    {integration.endpoint && <p className="truncate"><span className="font-medium">Endpoint:</span> <span className="font-mono">{integration.endpoint}</span></p>}
                    {integration.latencyMs !== null && (
                      <p><span className="font-medium">Latency:</span> {integration.latencyMs}ms</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/30 px-6 py-3 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" /> {new Date(integration.lastChecked).toLocaleTimeString()}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" aria-label={`Test ${integration.name} connection`} title={`Test ${integration.name} connection`} onClick={() => handleTestConnection(integration)} disabled={isTesting}>
                      {isTesting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Activity className="h-3 w-3 mr-1" />}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info Footer */}
      <Alert className="border-blue-500/50 bg-blue-50 dark:bg-blue-950">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle>Secrets Management</AlertTitle>
        <AlertDescription>
          API keys and database credentials are never displayed here. Update them via Render Environment Variables or GitHub Secrets, then redeploy the affected service.
        </AlertDescription>
      </Alert>

    </div>
  );
}
