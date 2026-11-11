import { useMemo } from 'react';
import { FlaskConical } from 'lucide-react';
import { usePatients } from '@/hooks/use-patients';
import { useProviders } from '@/hooks/use-providers';
import { useArchiveLabResult, useLabResults, useSaveLabResult } from '@/hooks/use-clinical-records';
import type { LabResult, LabResultPayload, LabResultStatus } from '@/types/clinical-records';
import { ClinicalRecordWorkspace, type ClinicalField, type ClinicalRecordRow } from './ClinicalRecordWorkspace';

function localDateTime(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toForm(result: LabResult): Record<string, string> {
  return {
    patientId: result.patientId,
    providerId: result.providerId,
    testName: result.testName,
    testCode: result.testCode ?? '',
    status: result.status,
    resultValue: result.resultValue ?? '',
    unit: result.unit ?? '',
    referenceRange: result.referenceRange ?? '',
    notes: result.notes ?? '',
    orderedAt: localDateTime(result.orderedAt),
    resultedAt: localDateTime(result.resultedAt),
  };
}

function toPayload(values: Record<string, string>): LabResultPayload {
  return {
    patientId: values.patientId,
    providerId: values.providerId,
    testName: values.testName,
    testCode: values.testCode || undefined,
    status: values.status as LabResultStatus,
    resultValue: values.resultValue || undefined,
    unit: values.unit || undefined,
    referenceRange: values.referenceRange || undefined,
    notes: values.notes || undefined,
    orderedAt: new Date(values.orderedAt).toISOString(),
    resultedAt: values.resultedAt ? new Date(values.resultedAt).toISOString() : undefined,
  };
}

export default function LabResultsPage() {
  const recordsQuery = useLabResults();
  const patientsQuery = usePatients({ page: 0, size: 100 });
  const providersQuery = useProviders({ page: 0, size: 100 });
  const save = useSaveLabResult();
  const archive = useArchiveLabResult();
  const patients = useMemo(() => patientsQuery.data?.content ?? [], [patientsQuery.data]);
  const providers = useMemo(() => providersQuery.data?.content ?? [], [providersQuery.data]);
  const patientNames = useMemo(() => new Map(patients.map((p) => [p.id, `${p.firstName} ${p.lastName}`])), [patients]);
  const providerNames = useMemo(() => new Map(providers.map((p) => [p.id, `${p.firstName} ${p.lastName}`])), [providers]);
  const rows: ClinicalRecordRow[] = (recordsQuery.data ?? []).map((result) => ({
    id: result.id,
    patient: patientNames.get(result.patientId) ?? result.patientId,
    provider: providerNames.get(result.providerId) ?? result.providerId,
    date: result.orderedAt,
    title: result.testName,
    summary: [result.resultValue, result.unit, result.referenceRange].filter(Boolean).join(' · '),
    status: result.status,
    form: toForm(result),
  }));
  const fields: ClinicalField[] = [
    { name: 'patientId', label: 'Patient', kind: 'select', required: true, options: patients.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName}` })) },
    { name: 'providerId', label: 'Ordering provider', kind: 'select', required: true, options: providers.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName}` })) },
    { name: 'testName', label: 'Test name', kind: 'text', required: true },
    { name: 'testCode', label: 'Test code', kind: 'text' },
    { name: 'status', label: 'Status', kind: 'select', required: true, options: [
      { value: 'ORDERED', label: 'Ordered' },
      { value: 'IN_PROGRESS', label: 'In progress' },
      { value: 'COMPLETED', label: 'Completed' },
      { value: 'CANCELLED', label: 'Cancelled' },
    ] },
    { name: 'orderedAt', label: 'Ordered at', kind: 'datetime-local', required: true },
    { name: 'resultedAt', label: 'Resulted at', kind: 'datetime-local' },
    { name: 'resultValue', label: 'Result', kind: 'text' },
    { name: 'unit', label: 'Unit', kind: 'text' },
    { name: 'referenceRange', label: 'Reference range', kind: 'text' },
    { name: 'notes', label: 'Notes', kind: 'textarea' },
  ];

  return (
    <ClinicalRecordWorkspace
      title="Laboratory results"
      description="Track tenant-scoped lab orders and results with controlled status and audit-safe archiving."
      icon={FlaskConical}
      records={rows}
      fields={fields}
      defaults={{ patientId: '', providerId: '', testName: '', testCode: '', status: 'ORDERED', resultValue: '', unit: '', referenceRange: '', notes: '', orderedAt: localDateTime(new Date().toISOString()), resultedAt: '' }}
      isLoading={recordsQuery.isLoading || patientsQuery.isLoading || providersQuery.isLoading}
      isError={recordsQuery.isError || patientsQuery.isError || providersQuery.isError}
      isSaving={save.isPending}
      isArchiving={archive.isPending}
      onRefresh={() => { void recordsQuery.refetch(); void patientsQuery.refetch(); void providersQuery.refetch(); }}
      onSave={async (id, values) => save.mutateAsync({ id, payload: toPayload(values) }).then(() => undefined)}
      onArchive={(id) => archive.mutateAsync(id).then(() => undefined)}
    />
  );
}
