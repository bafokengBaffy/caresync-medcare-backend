CREATE TABLE lab_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    test_name VARCHAR(200) NOT NULL,
    test_code VARCHAR(64),
    status VARCHAR(24) NOT NULL CHECK (status IN ('ORDERED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    result_value VARCHAR(1000),
    unit VARCHAR(64),
    reference_range VARCHAR(200),
    notes VARCHAR(2000),
    ordered_at TIMESTAMPTZ NOT NULL,
    resulted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ,
    CONSTRAINT fk_lab_results_patient_tenant
        FOREIGN KEY (tenant_id, patient_id)
        REFERENCES public.patients (tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_lab_results_provider_tenant
        FOREIGN KEY (tenant_id, provider_id)
        REFERENCES public.providers (tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT ck_lab_results_result_date
        CHECK (resulted_at IS NULL OR resulted_at >= ordered_at)
);

CREATE INDEX idx_lab_results_active_tenant_ordered
    ON lab_results (tenant_id, ordered_at DESC) WHERE archived_at IS NULL;
CREATE INDEX idx_lab_results_active_tenant_patient
    ON lab_results (tenant_id, patient_id, ordered_at DESC) WHERE archived_at IS NULL;
CREATE INDEX idx_lab_results_active_tenant_provider
    ON lab_results (tenant_id, provider_id, ordered_at DESC) WHERE archived_at IS NULL;

ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_lab_results ON lab_results
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());
