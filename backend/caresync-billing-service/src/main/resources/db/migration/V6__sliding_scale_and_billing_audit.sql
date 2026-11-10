CREATE TABLE sliding_scale_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    minimum_annual_income_cents BIGINT NOT NULL CHECK (minimum_annual_income_cents >= 0),
    maximum_annual_income_cents BIGINT,
    discount_percentage NUMERIC(5, 2) NOT NULL
        CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_sliding_scale_income_range
        CHECK (maximum_annual_income_cents IS NULL
            OR maximum_annual_income_cents > minimum_annual_income_cents),
    CONSTRAINT uq_sliding_scale_rules_tenant_id UNIQUE (tenant_id, id)
);

CREATE INDEX idx_sliding_scale_rules_tenant_active_income
    ON sliding_scale_rules (tenant_id, minimum_annual_income_cents DESC)
    WHERE is_active = TRUE;

CREATE TABLE sliding_scale_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL,
    rule_id UUID NOT NULL,
    original_amount_cents BIGINT NOT NULL CHECK (original_amount_cents >= 0),
    discount_amount_cents BIGINT NOT NULL CHECK (discount_amount_cents >= 0),
    resulting_amount_cents BIGINT NOT NULL CHECK (resulting_amount_cents >= 0),
    applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_sliding_scale_application_invoice UNIQUE (tenant_id, invoice_id),
    CONSTRAINT fk_sliding_scale_application_invoice
        FOREIGN KEY (tenant_id, invoice_id) REFERENCES invoices (tenant_id, id),
    CONSTRAINT fk_sliding_scale_application_rule
        FOREIGN KEY (tenant_id, rule_id) REFERENCES sliding_scale_rules (tenant_id, id)
);

CREATE TABLE billing_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    action VARCHAR(60) NOT NULL,
    resource_type VARCHAR(60) NOT NULL,
    resource_id UUID NOT NULL,
    actor_name VARCHAR(200),
    details VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_billing_audit_logs_tenant_resource
    ON billing_audit_logs (tenant_id, resource_type, resource_id, created_at DESC);

ALTER TABLE sliding_scale_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sliding_scale_rules FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_sliding_scale_rules ON sliding_scale_rules
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::UUID)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::UUID);

ALTER TABLE sliding_scale_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sliding_scale_applications FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_sliding_scale_applications ON sliding_scale_applications
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::UUID)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::UUID);

ALTER TABLE billing_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_audit_logs FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_billing_audit_logs ON billing_audit_logs
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::UUID)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::UUID);
