CREATE TABLE service_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,
    description VARCHAR(500) NOT NULL,
    unit_price_cents BIGINT NOT NULL CHECK (unit_price_cents >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'LSL',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_service_fees_tenant_code UNIQUE (tenant_id, code),
    CONSTRAINT uq_service_fees_tenant_id UNIQUE (tenant_id, id)
);

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL,
    appointment_id UUID,
    invoice_number VARCHAR(50) NOT NULL,
    amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'LSL',
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'VOID')),
    issued_at TIMESTAMPTZ,
    due_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_invoices_tenant_number UNIQUE (tenant_id, invoice_number),
    CONSTRAINT uq_invoices_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT fk_invoice_patient_tenant
        FOREIGN KEY (tenant_id, patient_id) REFERENCES patients(tenant_id, id),
    CONSTRAINT fk_invoice_appointment_tenant
        FOREIGN KEY (tenant_id, appointment_id) REFERENCES appointments(tenant_id, id)
);

CREATE INDEX idx_invoices_tenant_created ON invoices(tenant_id, created_at DESC);
CREATE INDEX idx_invoices_tenant_patient ON invoices(tenant_id, patient_id);

CREATE TABLE invoice_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL,
    fee_id UUID NOT NULL,
    code VARCHAR(32) NOT NULL,
    description VARCHAR(500) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_cents BIGINT NOT NULL CHECK (unit_price_cents >= 0),
    total_cents BIGINT GENERATED ALWAYS AS (quantity * unit_price_cents) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_line_item_invoice_tenant
        FOREIGN KEY (tenant_id, invoice_id) REFERENCES invoices(tenant_id, id),
    CONSTRAINT fk_line_item_fee_tenant
        FOREIGN KEY (tenant_id, fee_id) REFERENCES service_fees(tenant_id, id)
);

CREATE INDEX idx_line_items_invoice ON invoice_line_items(tenant_id, invoice_id);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL,
    amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'LSL',
    method VARCHAR(30) NOT NULL
        CHECK (method IN ('CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_MONEY', 'OTHER')),
    status VARCHAR(30) NOT NULL DEFAULT 'RECORDED'
        CHECK (status IN ('RECORDED', 'REVERSED')),
    external_ref VARCHAR(255),
    paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_payment_invoice_tenant
        FOREIGN KEY (tenant_id, invoice_id) REFERENCES invoices(tenant_id, id)
);

CREATE INDEX idx_payments_invoice ON payments(tenant_id, invoice_id, paid_at);
