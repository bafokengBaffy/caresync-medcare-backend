CREATE TABLE patient_diagnosis_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL,
    coding_system VARCHAR(40) NOT NULL,
    diagnosis_code VARCHAR(40) NOT NULL,
    coded_on DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_patient_diagnosis_codes_patient_tenant
        FOREIGN KEY (tenant_id, patient_id) REFERENCES patients (tenant_id, id) ON DELETE RESTRICT
);

CREATE INDEX idx_patient_diagnosis_codes_tenant_patient_active
    ON patient_diagnosis_codes (tenant_id, patient_id, coded_on DESC)
    WHERE is_active = TRUE;
CREATE INDEX idx_patient_diagnosis_codes_tenant_code
    ON patient_diagnosis_codes (tenant_id, coding_system, diagnosis_code)
    WHERE is_active = TRUE;

ALTER TABLE patient_diagnosis_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_diagnosis_codes FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_patient_diagnosis_codes ON patient_diagnosis_codes
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());
