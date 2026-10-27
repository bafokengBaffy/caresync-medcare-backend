CREATE TABLE patient_guardians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL,
    guardian_user_id VARCHAR(128) NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    relationship_type VARCHAR(32) NOT NULL
        CHECK (relationship_type IN ('PARENT', 'LEGAL_GUARDIAN', 'SPOUSE', 'CHILD', 'SIBLING', 'OTHER')),
    email VARCHAR(254),
    phone VARCHAR(32),
    primary_contact BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_patient_guardians_patient_tenant
        FOREIGN KEY (patient_id, tenant_id)
        REFERENCES patients (id, tenant_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_patient_guardians_tenant_patient
    ON patient_guardians (tenant_id, patient_id, created_at DESC);
CREATE UNIQUE INDEX uq_patient_guardians_one_primary
    ON patient_guardians (tenant_id, patient_id)
    WHERE primary_contact;

ALTER TABLE patient_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_guardians FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_patient_guardians ON patient_guardians
    FOR ALL USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());
