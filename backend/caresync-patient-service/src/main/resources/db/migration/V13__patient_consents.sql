CREATE TABLE consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    consent_type VARCHAR(64) NOT NULL,
    status VARCHAR(16) NOT NULL CHECK (status IN ('GRANTED', 'REVOKED', 'EXPIRED')),
    purpose VARCHAR(2000) NOT NULL,
    granted_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revocation_reason VARCHAR(1000),
    idempotency_key VARCHAR(128),
    request_fingerprint VARCHAR(64),
    created_by VARCHAR(128) NOT NULL,
    updated_by VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uq_consents_tenant_idempotency UNIQUE (tenant_id, idempotency_key)
);

CREATE INDEX idx_consents_tenant_patient_created
    ON consents (tenant_id, patient_id, created_at DESC);
CREATE INDEX idx_consents_tenant_patient_type_status
    ON consents (tenant_id, patient_id, consent_type, status);
CREATE INDEX idx_consents_expiration
    ON consents (tenant_id, expires_at)
    WHERE status = 'GRANTED' AND expires_at IS NOT NULL;

CREATE TABLE patient_consent_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    consent_id UUID NOT NULL REFERENCES consents(id) ON DELETE CASCADE,
    action VARCHAR(24) NOT NULL,
    previous_status VARCHAR(16),
    new_status VARCHAR(16),
    reason VARCHAR(1000),
    actor_user_id VARCHAR(128) NOT NULL,
    correlation_id VARCHAR(128),
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_consent_history_tenant_consent_time
    ON patient_consent_history (tenant_id, consent_id, occurred_at DESC);

ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_consents ON consents
    FOR ALL USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

ALTER TABLE patient_consent_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_consent_history FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_patient_consent_history ON patient_consent_history
    FOR ALL USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());
