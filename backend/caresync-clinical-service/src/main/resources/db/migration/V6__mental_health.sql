CREATE TABLE mental_health_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    assessment_date DATE NOT NULL,
    assessment_tool VARCHAR(100),
    score INTEGER CHECK (score IS NULL OR score >= 0),
    findings VARCHAR(4000) NOT NULL,
    risk_level VARCHAR(64),
    care_plan VARCHAR(4000),
    notes VARCHAR(2000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_mental_health_assessments_patient_tenant
        FOREIGN KEY (tenant_id, patient_id) REFERENCES patients (tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_mental_health_assessments_provider_tenant
        FOREIGN KEY (tenant_id, provider_id) REFERENCES providers (tenant_id, id) ON DELETE RESTRICT
);

CREATE INDEX idx_mental_health_assessments_tenant_patient_date
    ON mental_health_assessments (tenant_id, patient_id, assessment_date DESC);
CREATE INDEX idx_mental_health_assessments_tenant_provider_date
    ON mental_health_assessments (tenant_id, provider_id, assessment_date DESC);

ALTER TABLE mental_health_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mental_health_assessments FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_mental_health_assessments ON mental_health_assessments
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());