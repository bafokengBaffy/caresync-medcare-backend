import { useMemo } from 'react';
import { Stethoscope } from 'lucide-react';
import { usePatients } from '@/hooks/use-patients';
import { useProviders } from '@/hooks/use-providers';
import { useArchiveDentalChart, useDentalCharts, useSaveDentalChart } from '@/hooks/use-clinical-records';
import type { DentalChart, DentalChartPayload } from '@/types/clinical-records';
import { ClinicalRecordWorkspace, type ClinicalField, type ClinicalRecordRow } from './ClinicalRecordWorkspace';

const today = new Date().toISOString().slice(0, 10);

function toForm(chart: DentalChart): Record<string, string> {
  return {
    patientId: chart.patientId,
    providerId: chart.providerId,
    chartDate: chart.chartDate,
    findings: chart.findings,
    treatmentPlan: chart.treatmentPlan ?? '',
    notes: chart.notes ?? '',
  };
}

function toPayload(values: Record<string, string>): DentalChartPayload {
  return {
    patientId: values.patientId,
    providerId: values.providerId,
    chartDate: values.chartDate,
    findings: values.findings,
    treatmentPlan: values.treatmentPlan || undefined,
    notes: values.notes || undefined,
  };
}

export default function DentalChartsPage() {
  const recordsQuery = useDentalCharts();
  const patientsQuery = usePatients({ page: 0, size: 100 });
  const providersQuery = useProviders({ page: 0, size: 100 });
  const save = useSaveDentalChart();
  const archive = useArchiveDentalChart();
  const patients = useMemo(() => patientsQuery.data?.content ?? [], [patientsQuery.data]);
  const providers = useMemo(() => providersQuery.data?.content ?? [], [providersQuery.data]);
  const patientNames = useMemo(() => new Map(patients.map((p) => [p.id, `${p.firstName} ${p.lastName}`])), [patients]);
  const providerNames = useMemo(() => new Map(providers.map((p) => [p.id, `${p.firstName} ${p.lastName}`])), [providers]);
  const rows: ClinicalRecordRow[] = (recordsQuery.data ?? []).map((chart) => ({
    id: chart.id,
    patient: patientNames.get(chart.patientId) ?? chart.patientId,
    provider: providerNames.get(chart.providerId) ?? chart.providerId,
    date: chart.chartDate,
    title: `Dental chart · ${chart.chartDate}`,
    summary: chart.findings,
    form: toForm(chart),
  }));
  const fields: ClinicalField[] = [
    { name: 'patientId', label: 'Patient', kind: 'select', required: true, options: patients.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName}` })) },
    { name: 'providerId', label: 'Provider', kind: 'select', required: true, options: providers.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName}` })) },
    { name: 'chartDate', label: 'Chart date', kind: 'date', required: true },
    { name: 'findings', label: 'Findings', kind: 'textarea', required: true },
    { name: 'treatmentPlan', label: 'Treatment plan', kind: 'textarea' },
    { name: 'notes', label: 'Notes', kind: 'textarea' },
  ];

  return (
    <ClinicalRecordWorkspace
      title="Dental charts"
      description="Create, update, and archive tenant-scoped dental chart records."
      icon={Stethoscope}
      records={rows}
      fields={fields}
      defaults={{ patientId: '', providerId: '', chartDate: today, findings: '', treatmentPlan: '', notes: '' }}
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
