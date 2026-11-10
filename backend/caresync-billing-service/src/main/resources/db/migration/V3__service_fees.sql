CREATE TABLE service_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(80) NOT NULL,
    description VARCHAR(255) NOT NULL,
    unit_price_cents BIGINT NOT NULL CHECK (unit_price_cents >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'LSL',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_service_fees_tenant_code UNIQUE (tenant_id, code),
    CONSTRAINT uq_service_fees_tenant_id UNIQUE (tenant_id, id)
);

CREATE TABLE invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL,
    fee_id UUID NOT NULL,
    code VARCHAR(80) NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_cents BIGINT NOT NULL CHECK (unit_price_cents >= 0),
    CONSTRAINT fk_invoice_lines_invoice_tenant
        FOREIGN KEY (tenant_id, invoice_id) REFERENCES invoices (tenant_id, id),
    CONSTRAINT fk_invoice_lines_fee_tenant
        FOREIGN KEY (tenant_id, fee_id) REFERENCES service_fees (tenant_id, id)
);

CREATE INDEX idx_invoice_lines_tenant_invoice ON invoice_line_items (tenant_id, invoice_id);

ALTER TABLE service_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_fees FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_service_fees ON service_fees
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::UUID)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::UUID);

ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_invoice_lines ON invoice_line_items
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::UUID)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::UUID);