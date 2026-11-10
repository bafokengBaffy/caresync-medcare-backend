CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL,
    amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'LSL',
    method VARCHAR(40) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'RECORDED'
        CHECK (status IN ('RECORDED', 'VOID')),
    external_ref VARCHAR(255),
    paid_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_payments_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT fk_payments_invoice_tenant
        FOREIGN KEY (tenant_id, invoice_id) REFERENCES invoices (tenant_id, id)
);

CREATE INDEX idx_payments_tenant_paid_at ON payments (tenant_id, paid_at DESC);
CREATE INDEX idx_payments_tenant_invoice ON payments (tenant_id, invoice_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_payments ON payments
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::UUID)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::UUID);