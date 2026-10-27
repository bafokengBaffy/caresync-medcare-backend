ALTER TABLE patients
    ADD COLUMN merged_into_patient_id UUID REFERENCES patients(id),
    ADD COLUMN merged_at TIMESTAMPTZ,
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

CREATE INDEX idx_patients_active_tenant
    ON patients (tenant_id, id)
    WHERE merged_into_patient_id IS NULL;

CREATE TABLE patient_merge_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    source_patient_id UUID NOT NULL REFERENCES patients(id),
    target_patient_id UUID NOT NULL REFERENCES patients(id),
    status VARCHAR(16) NOT NULL
        CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'REVERSED')),
    requester_user_id VARCHAR(128) NOT NULL,
    confirmer_user_id VARCHAR(128),
    request_reason VARCHAR(1000) NOT NULL,
    decision_reason VARCHAR(1000),
    correlation_id VARCHAR(128),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    reversed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT ck_patient_merge_distinct_patients CHECK (source_patient_id <> target_patient_id)
);

CREATE INDEX idx_patient_merge_tenant_status_requested
    ON patient_merge_logs (tenant_id, status, requested_at DESC);
CREATE INDEX idx_patient_merge_source
    ON patient_merge_logs (tenant_id, source_patient_id, requested_at DESC);
CREATE INDEX idx_patient_merge_target
    ON patient_merge_logs (tenant_id, target_patient_id, requested_at DESC);
CREATE UNIQUE INDEX uq_patient_merge_pending_pair
    ON patient_merge_logs (
        tenant_id,
        LEAST(source_patient_id, target_patient_id),
        GREATEST(source_patient_id, target_patient_id)
    )
    WHERE status = 'PENDING';

ALTER TABLE patient_merge_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_merge_logs FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_patient_merge_logs ON patient_merge_logs
    FOR ALL USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());
