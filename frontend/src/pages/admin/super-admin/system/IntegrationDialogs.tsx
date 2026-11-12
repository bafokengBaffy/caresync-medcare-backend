// frontend/src/pages/admin/super-admin/system/IntegrationDialogs.tsx
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { NativeSelect as Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  ENV_LABELS,
  isValidReason,
  isValidTicketRef,
  sanitizeText,
} from '@/api/integrations';
import type {
  EnvironmentName,
  IntegrationServiceDescriptor,
} from '@/types/integration';

type AsyncState = 'idle' | 'submitting' | 'success' | 'error';

// ---------- Probe Dialog ----------
export interface ProbeDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (o: boolean) => void;
  readonly service: IntegrationServiceDescriptor | null;
  readonly onConfirm: (args: { checkId: string; reason: string }) => Promise<void>;
}

export function ProbeDialog({ open, onOpenChange, service, onConfirm }: ProbeDialogProps) {
  const [checkId, setCheckId] = useState('');
  const [reason, setReason] = useState('');
  const [state, setState] = useState<AsyncState>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && service) {
      setCheckId(service.healthChecks[0]?.id ?? '');
      setReason('');
      setState('idle');
      setError(null);
    }
  }, [open, service]);

  const selectedCheck = useMemo(
    () => service?.healthChecks.find((c) => c.id === checkId),
    [service, checkId],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !checkId) return;
    if (!isValidReason(reason)) {
      setError('Please provide a reason (minimum 3 characters).');
      return;
    }
    setState('submitting');
    setError(null);
    try {
      await onConfirm({ checkId, reason: sanitizeText(reason) });
      setState('success');
      setTimeout(() => onOpenChange(false), 600);
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Failed to trigger probe.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" aria-hidden="true" />
            Trigger health probe
          </DialogTitle>
          <DialogDescription>
            Run a read-only probe against{' '}
            <span className="font-medium text-foreground">{service?.name}</span>. Probes are
            safe and audited.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Unable to run probe</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="probe-check">Probe target</Label>
            <Select
              id="probe-check"
              value={checkId}
              onValueChange={setCheckId}
              disabled={state === 'submitting'}
            >
              {(service?.healthChecks ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            {selectedCheck ? (
              <p className="text-xs text-muted-foreground">
                {selectedCheck.method} {selectedCheck.endpoint} · expected {selectedCheck.expectStatus}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="probe-reason">Reason</Label>
            <Textarea
              id="probe-reason"
              value={reason}
              onChange={(e) => setReason(sanitizeText(e.target.value))}
              placeholder="e.g. Verify connection after key rotation"
              maxLength={500}
              rows={2}
              disabled={state === 'submitting'}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={state === 'submitting'}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={state === 'submitting' || !checkId}>
              {state === 'submitting' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running…
                </>
              ) : state === 'success' ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Done
                </>
              ) : (
                'Run probe'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Rotation Recording Dialog ----------
export interface RotationDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (o: boolean) => void;
  readonly service: IntegrationServiceDescriptor | null;
  readonly onConfirm: (args: {
    environment: EnvironmentName;
    keysRotated: readonly string[];
    reason: string;
    rotationTicketRef?: string;
  }) => Promise<void>;
}

export function RotationDialog({ open, onOpenChange, service, onConfirm }: RotationDialogProps) {
  const [environment, setEnvironment] = useState<EnvironmentName>('production');
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [ticket, setTicket] = useState('');
  const [reason, setReason] = useState('');
  const [state, setState] = useState<AsyncState>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && service) {
      setEnvironment(service.environments[0] ?? 'production');
      setKeys(new Set());
      setTicket('');
      setReason('');
      setState('idle');
      setError(null);
    }
  }, [open, service]);

  const toggleKey = (k: string) => {
    setKeys((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;
    if (keys.size === 0) {
      setError('Select at least one key that was rotated.');
      return;
    }
    if (!isValidTicketRef(ticket)) {
      setError('Ticket reference format looks invalid (e.g. SEC-1234).');
      return;
    }
    if (!isValidReason(reason)) {
      setError('Please provide a reason (minimum 3 characters).');
      return;
    }
    setState('submitting');
    setError(null);
    try {
      await onConfirm({
        environment,
        keysRotated: Array.from(keys),
        reason: sanitizeText(reason),
        rotationTicketRef: ticket ? ticket.trim().toUpperCase() : undefined,
      });
      setState('success');
      setTimeout(() => onOpenChange(false), 600);
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Failed to record rotation.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" aria-hidden="true" />
            Record credential rotation
          </DialogTitle>
          <DialogDescription>
            Record that credentials were rotated for{' '}
            <span className="font-medium text-foreground">{service?.name}</span>. Values are
            never entered or stored here — only presence and metadata.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Unable to record rotation</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="rotation-env">Environment</Label>
            <Select
              id="rotation-env"
              value={environment}
              onValueChange={(v) => setEnvironment(v as EnvironmentName)}
              disabled={state === 'submitting'}
            >
              {(service?.environments ?? []).map((env) => (
                <option key={env} value={env}>
                  {ENV_LABELS[env]}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Keys rotated</Label>
            <div className="max-h-48 space-y-1.5 overflow-auto rounded border p-2">
              {(service?.credentialFields ?? []).map((f) => (
                <label
                  key={f.key}
                  className={cn(
                    'flex cursor-pointer items-start gap-2 rounded p-1.5 text-sm hover:bg-muted/50',
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={keys.has(f.key)}
                    onChange={() => toggleKey(f.key)}
                    disabled={state === 'submitting'}
                  />
                  <span className="min-w-0">
                    <span className="block font-mono text-xs">{f.key}</span>
                    <span className="block text-xs text-muted-foreground">{f.label}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rotation-ticket">Rotation ticket reference (optional)</Label>
            <Input
              id="rotation-ticket"
              value={ticket}
              onChange={(e) => setTicket(e.target.value.toUpperCase())}
              placeholder="e.g. SEC-1234"
              maxLength={31}
              disabled={state === 'submitting'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rotation-reason">Reason</Label>
            <Textarea
              id="rotation-reason"
              value={reason}
              onChange={(e) => setReason(sanitizeText(e.target.value))}
              rows={2}
              maxLength={500}
              disabled={state === 'submitting'}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={state === 'submitting'}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={state === 'submitting'}>
              {state === 'submitting' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording…
                </>
              ) : state === 'success' ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Recorded
                </>
              ) : (
                'Record rotation'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
