CREATE TABLE nursing_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    assessment_date DATE NOT NULL,
    chief_complaint VARCHAR(2000),
    findings VARCHAR(4000) NOT NULL,
    care_plan VARCHAR(4000),
    notes VARCHAR(2000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_nursing_assessments_patient_tenant
        FOREIGN KEY (tenant_id, patient_id) REFERENCES patients (tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_nursing_assessments_provider_tenant
        FOREIGN KEY (tenant_id, provider_id) REFERENCES providers (tenant_id, id) ON DELETE RESTRICT
);

CREATE INDEX idx_nursing_assessments_tenant_patient_date
    ON nursing_assessments (tenant_id, patient_id, assessment_date DESC);
CREATE INDEX idx_nursing_assessments_tenant_provider_date
    ON nursing_assessments (tenant_id, provider_id, assessment_date DESC);

ALTER TABLE nursing_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE nursing_assessments FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_nursing_assessments ON nursing_assessments
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());