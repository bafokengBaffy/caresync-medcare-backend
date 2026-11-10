CREATE TABLE medical_aid_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL,
    provider_name VARCHAR(120) NOT NULL,
    member_number VARCHAR(120) NOT NULL,
    claim_amount_cents BIGINT NOT NULL CHECK (claim_amount_cents > 0),
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED'
        CHECK (status IN ('SUBMITTED', 'APPROVED', 'REJECTED')),
    decision_reason VARCHAR(500),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    decision_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_medical_aid_claims_invoice_tenant
        FOREIGN KEY (tenant_id, invoice_id) REFERENCES invoices (tenant_id, id)
);

CREATE INDEX idx_medical_aid_claims_tenant_status
    ON medical_aid_claims (tenant_id, status, submitted_at DESC);

ALTER TABLE medical_aid_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_aid_claims FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_medical_aid_claims ON medical_aid_claims
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::UUID)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::UUID);