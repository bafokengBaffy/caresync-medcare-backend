import { useQuery } from '@tanstack/react-query';
import { auditApi } from '@/api/audit';
export function useAuditLogs(params?: Record<string, unknown>) { return useQuery({ queryKey: ['audit', params], queryFn: () => auditApi.list(params) }); }
