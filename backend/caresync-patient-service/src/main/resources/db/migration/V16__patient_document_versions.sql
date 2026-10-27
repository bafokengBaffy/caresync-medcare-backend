ALTER TABLE patient_documents
    ADD CONSTRAINT uq_patient_documents_id_tenant UNIQUE (id, tenant_id);

CREATE TABLE patient_document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL,
    document_id UUID NOT NULL,
    version_number INTEGER NOT NULL CHECK (version_number > 0),
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(255) NOT NULL,
    size_bytes BIGINT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760),
    storage_key VARCHAR(512) NOT NULL,
    created_by VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uq_patient_document_versions_number UNIQUE (tenant_id, document_id, version_number),
    CONSTRAINT fk_patient_document_versions_document_tenant
        FOREIGN KEY (document_id, tenant_id)
        REFERENCES patient_documents (id, tenant_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_patient_document_versions_patient_tenant
        FOREIGN KEY (patient_id, tenant_id)
        REFERENCES patients (id, tenant_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_patient_document_versions_patient_document
    ON patient_document_versions (tenant_id, patient_id, document_id, version_number DESC);

ALTER TABLE patient_document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_document_versions FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_patient_document_versions ON patient_document_versions
    FOR ALL USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());
