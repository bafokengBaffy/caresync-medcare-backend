CREATE UNIQUE INDEX IF NOT EXISTS uq_patients_tenant_id_id ON patients (tenant_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_providers_tenant_id_id ON providers (tenant_id, id);

CREATE TABLE dental_charts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    chart_date DATE NOT NULL,
    findings VARCHAR(4000) NOT NULL,
    treatment_plan VARCHAR(4000),
    notes VARCHAR(2000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_dental_charts_patient_tenant
        FOREIGN KEY (tenant_id, patient_id) REFERENCES patients (tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_dental_charts_provider_tenant
        FOREIGN KEY (tenant_id, provider_id) REFERENCES providers (tenant_id, id) ON DELETE RESTRICT
);

CREATE INDEX idx_dental_charts_tenant_patient_date
    ON dental_charts (tenant_id, patient_id, chart_date DESC);
CREATE INDEX idx_dental_charts_tenant_provider_date
    ON dental_charts (tenant_id, provider_id, chart_date DESC);

ALTER TABLE dental_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE dental_charts FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_dental_charts ON dental_charts
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());