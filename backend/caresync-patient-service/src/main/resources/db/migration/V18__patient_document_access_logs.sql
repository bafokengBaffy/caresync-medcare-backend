CREATE TABLE patient_document_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL,
    document_id UUID,
    actor_user_id VARCHAR(128) NOT NULL,
    action VARCHAR(16) NOT NULL CHECK (action IN ('LIST', 'UPLOAD', 'DOWNLOAD', 'DELETE', 'RESTORE')),
    correlation_id VARCHAR(128),
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_document_access_tenant
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_document_access_tenant_document_time
    ON patient_document_access_logs (tenant_id, document_id, occurred_at DESC);
CREATE INDEX idx_document_access_tenant_patient_time
    ON patient_document_access_logs (tenant_id, patient_id, occurred_at DESC);

ALTER TABLE patient_document_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_document_access_logs FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_document_access_logs ON patient_document_access_logs
    FOR ALL USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());
