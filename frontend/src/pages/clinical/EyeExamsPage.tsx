import { useMemo } from 'react';
import { Eye } from 'lucide-react';
import { usePatients } from '@/hooks/use-patients';
import { useProviders } from '@/hooks/use-providers';
import { useArchiveEyeExam, useEyeExams, useSaveEyeExam } from '@/hooks/use-clinical-records';
import type { EyeExam, EyeExamPayload } from '@/types/clinical-records';
import { ClinicalRecordWorkspace, type ClinicalField, type ClinicalRecordRow } from './ClinicalRecordWorkspace';

const today = new Date().toISOString().slice(0, 10);

function toForm(exam: EyeExam): Record<string, string> {
  return {
    patientId: exam.patientId,
    providerId: exam.providerId,
    examDate: exam.examDate,
    rightEyeAcuity: exam.rightEyeAcuity ?? '',
    leftEyeAcuity: exam.leftEyeAcuity ?? '',
    diagnosis: exam.diagnosis ?? '',
    prescription: exam.prescription ?? '',
    notes: exam.notes ?? '',
  };
}

function toPayload(values: Record<string, string>): EyeExamPayload {
  return {
    patientId: values.patientId,
    providerId: values.providerId,
    examDate: values.examDate,
    rightEyeAcuity: values.rightEyeAcuity || undefined,
    leftEyeAcuity: values.leftEyeAcuity || undefined,
    diagnosis: values.diagnosis || undefined,
    prescription: values.prescription || undefined,
    notes: values.notes || undefined,
  };
}

export default function EyeExamsPage() {
  const recordsQuery = useEyeExams();
  const patientsQuery = usePatients({ page: 0, size: 100 });
  const providersQuery = useProviders({ page: 0, size: 100 });
  const save = useSaveEyeExam();
  const archive = useArchiveEyeExam();
  const patients = useMemo(() => patientsQuery.data?.content ?? [], [patientsQuery.data]);
  const providers = useMemo(() => providersQuery.data?.content ?? [], [providersQuery.data]);
  const patientNames = useMemo(() => new Map(patients.map((p) => [p.id, `${p.firstName} ${p.lastName}`])), [patients]);
  const providerNames = useMemo(() => new Map(providers.map((p) => [p.id, `${p.firstName} ${p.lastName}`])), [providers]);
  const rows: ClinicalRecordRow[] = (recordsQuery.data ?? []).map((exam) => ({
    id: exam.id,
    patient: patientNames.get(exam.patientId) ?? exam.patientId,
    provider: providerNames.get(exam.providerId) ?? exam.providerId,
    date: exam.examDate,
    title: `Eye exam · ${exam.examDate}`,
    summary: [exam.diagnosis, exam.prescription].filter(Boolean).join(' · '),
    form: toForm(exam),
  }));
  const fields: ClinicalField[] = [
    { name: 'patientId', label: 'Patient', kind: 'select', required: true, options: patients.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName}` })) },
    { name: 'providerId', label: 'Provider', kind: 'select', required: true, options: providers.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName}` })) },
    { name: 'examDate', label: 'Exam date', kind: 'date', required: true },
    { name: 'rightEyeAcuity', label: 'Right eye acuity', kind: 'text' },
    { name: 'leftEyeAcuity', label: 'Left eye acuity', kind: 'text' },
    { name: 'diagnosis', label: 'Diagnosis', kind: 'textarea' },
    { name: 'prescription', label: 'Prescription', kind: 'textarea' },
    { name: 'notes', label: 'Notes', kind: 'textarea' },
  ];

  return (
    <ClinicalRecordWorkspace
      title="Optometry"
      description="Manage patient eye exams, findings, prescriptions, and clinical notes."
      icon={Eye}
      records={rows}
      fields={fields}
      defaults={{ patientId: '', providerId: '', examDate: today, rightEyeAcuity: '', leftEyeAcuity: '', diagnosis: '', prescription: '', notes: '' }}
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
