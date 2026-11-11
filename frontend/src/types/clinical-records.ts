export interface DentalChart {
  id: string;
  tenantId: string;
  patientId: string;
  providerId: string;
  chartDate: string;
  findings: string;
  treatmentPlan?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DentalChartPayload {
  patientId: string;
  providerId: string;
  chartDate: string;
  findings: string;
  treatmentPlan?: string;
  notes?: string;
}

export interface EyeExam {
  id: string;
  tenantId: string;
  patientId: string;
  providerId: string;
  examDate: string;
  rightEyeAcuity?: string | null;
  leftEyeAcuity?: string | null;
  diagnosis?: string | null;
  prescription?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EyeExamPayload {
  patientId: string;
  providerId: string;
  examDate: string;
  rightEyeAcuity?: string;
  leftEyeAcuity?: string;
  diagnosis?: string;
  prescription?: string;
  notes?: string;
}

export type LabResultStatus = 'ORDERED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface LabResult {
  id: string;
  tenantId: string;
  patientId: string;
  providerId: string;
  testName: string;
  testCode?: string | null;
  status: LabResultStatus;
  resultValue?: string | null;
  unit?: string | null;
  referenceRange?: string | null;
  notes?: string | null;
  orderedAt: string;
  resultedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LabResultPayload {
  patientId: string;
  providerId: string;
  testName: string;
  testCode?: string;
  status: LabResultStatus;
  resultValue?: string;
  unit?: string;
  referenceRange?: string;
  notes?: string;
  orderedAt: string;
  resultedAt?: string;
}
