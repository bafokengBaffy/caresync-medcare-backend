CREATE TABLE employee_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    employee_code VARCHAR(80) NOT NULL,
    first_name VARCHAR(120) NOT NULL,
    last_name VARCHAR(120) NOT NULL,
    email VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_employee_records_tenant_code UNIQUE (tenant_id, employee_code),
    CONSTRAINT uq_employee_records_tenant_id UNIQUE (tenant_id, id)
);

CREATE INDEX idx_employee_records_tenant_active
    ON employee_records (tenant_id, employee_code)
    WHERE is_active = TRUE;

CREATE TABLE salary_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL,
    base_salary_cents BIGINT NOT NULL CHECK (base_salary_cents >= 0),
    allowances_cents BIGINT NOT NULL DEFAULT 0 CHECK (allowances_cents >= 0),
    tax_percentage NUMERIC(5, 2) NOT NULL CHECK (tax_percentage >= 0 AND tax_percentage <= 100),
    other_deduction_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0
        CHECK (other_deduction_percentage >= 0 AND other_deduction_percentage <= 100),
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_salary_structures_deduction_rates
        CHECK (tax_percentage + other_deduction_percentage <= 100),
    CONSTRAINT ck_salary_structures_effective_range
        CHECK (effective_to IS NULL OR effective_to >= effective_from),
    CONSTRAINT fk_salary_structures_employee
        FOREIGN KEY (tenant_id, employee_id) REFERENCES employee_records (tenant_id, id),
    CONSTRAINT uq_salary_structures_tenant_id UNIQUE (tenant_id, id)
);

CREATE INDEX idx_salary_structures_tenant_employee_current
    ON salary_structures (tenant_id, employee_id, effective_from DESC)
    WHERE is_active = TRUE;

CREATE TABLE payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL,
    salary_structure_id UUID NOT NULL,
    pay_period_start DATE NOT NULL,
    gross_pay_cents BIGINT NOT NULL CHECK (gross_pay_cents >= 0),
    tax_deduction_cents BIGINT NOT NULL CHECK (tax_deduction_cents >= 0),
    other_deduction_cents BIGINT NOT NULL CHECK (other_deduction_cents >= 0),
    net_pay_cents BIGINT NOT NULL CHECK (net_pay_cents >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'LSL',
    generated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_payslips_tenant_employee_period
        UNIQUE (tenant_id, employee_id, pay_period_start),
    CONSTRAINT fk_payslips_employee
        FOREIGN KEY (tenant_id, employee_id) REFERENCES employee_records (tenant_id, id),
    CONSTRAINT fk_payslips_salary_structure
        FOREIGN KEY (tenant_id, salary_structure_id) REFERENCES salary_structures (tenant_id, id)
);

CREATE INDEX idx_payslips_tenant_period ON payslips (tenant_id, pay_period_start);

ALTER TABLE employee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_records FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_employee_records ON employee_records
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::UUID)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::UUID);

ALTER TABLE salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_structures FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_salary_structures ON salary_structures
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::UUID)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::UUID);

ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_payslips ON payslips
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::UUID)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::UUID);
