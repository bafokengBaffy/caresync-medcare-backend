CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_id_tenant
    ON patients (id, tenant_id);

CREATE TABLE patient_documents (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(255) NOT NULL,
    size_bytes BIGINT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760),
    media_url VARCHAR(512) NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (patient_id, tenant_id)
        REFERENCES patients (id, tenant_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_patient_documents_tenant_patient_uploaded
    ON patient_documents (tenant_id, patient_id, uploaded_at DESC);

ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_documents FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_patient_documents ON patient_documents
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());
