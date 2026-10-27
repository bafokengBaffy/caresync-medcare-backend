CREATE TABLE patient_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL,
    preferred_contact_method VARCHAR(16) NOT NULL
        CHECK (preferred_contact_method IN ('EMAIL', 'SMS', 'PHONE', 'POST')),
    preferred_language VARCHAR(35) NOT NULL,
    time_zone VARCHAR(64) NOT NULL,
    accessibility_needs VARCHAR(2000),
    email_reminders_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    sms_reminders_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    phone_reminders_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(128) NOT NULL,
    updated_by VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uq_patient_preferences_tenant_patient UNIQUE (tenant_id, patient_id),
    CONSTRAINT fk_patient_preferences_patient_tenant
        FOREIGN KEY (patient_id, tenant_id)
        REFERENCES patients (id, tenant_id)
        ON DELETE CASCADE
);

ALTER TABLE patient_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_preferences FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_patient_preferences ON patient_preferences
    FOR ALL USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());
