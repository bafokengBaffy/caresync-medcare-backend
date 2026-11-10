CREATE TABLE eye_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    exam_date DATE NOT NULL,
    right_eye_acuity VARCHAR(64),
    left_eye_acuity VARCHAR(64),
    diagnosis VARCHAR(1000),
    prescription VARCHAR(2000),
    notes VARCHAR(2000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_eye_exams_patient_tenant
        FOREIGN KEY (tenant_id, patient_id) REFERENCES patients (tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_eye_exams_provider_tenant
        FOREIGN KEY (tenant_id, provider_id) REFERENCES providers (tenant_id, id) ON DELETE RESTRICT
);

CREATE INDEX idx_eye_exams_tenant_patient_date
    ON eye_exams (tenant_id, patient_id, exam_date DESC);
CREATE INDEX idx_eye_exams_tenant_provider_date
    ON eye_exams (tenant_id, provider_id, exam_date DESC);

ALTER TABLE eye_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE eye_exams FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_eye_exams ON eye_exams
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());