CREATE TABLE patient_referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    referral_type VARCHAR(16) NOT NULL CHECK (referral_type IN ('INTERNAL', 'EXTERNAL')),
    recipient_name VARCHAR(200) NOT NULL,
    recipient_organization VARCHAR(200),
    reason TEXT NOT NULL,
    notes TEXT,
    status VARCHAR(16) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'SENT', 'ACCEPTED', 'DECLINED', 'COMPLETED', 'CANCELLED')),
    created_by VARCHAR(128) NOT NULL,
    updated_by VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_patient_referrals_tenant_patient_created
    ON patient_referrals (tenant_id, patient_id, created_at DESC);

ALTER TABLE patient_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_referrals FORCE ROW LEVEL SECURITY;

CREATE POLICY patient_referrals_tenant_access ON patient_referrals
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());
