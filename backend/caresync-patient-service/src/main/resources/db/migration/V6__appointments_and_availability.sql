CREATE UNIQUE INDEX IF NOT EXISTS uq_patients_tenant_id
    ON patients(tenant_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_providers_tenant_id
    ON providers(tenant_id, id);

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED'
        CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    appointment_type VARCHAR(50),
    firestore_note_id VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_appointment_time CHECK (scheduled_end > scheduled_start),
    CONSTRAINT fk_appointment_patient_tenant
        FOREIGN KEY (tenant_id, patient_id) REFERENCES patients(tenant_id, id),
    CONSTRAINT fk_appointment_provider_tenant
        FOREIGN KEY (tenant_id, provider_id) REFERENCES providers(tenant_id, id),
    CONSTRAINT uq_appointments_tenant_id UNIQUE (tenant_id, id)
);

CREATE INDEX idx_appointments_tenant_schedule
    ON appointments(tenant_id, scheduled_start);
CREATE INDEX idx_appointments_tenant_provider
    ON appointments(tenant_id, provider_id, scheduled_start);

CREATE TABLE provider_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INTEGER NOT NULL DEFAULT 30
        CHECK (slot_duration_minutes BETWEEN 5 AND 480),
    effective_from DATE,
    effective_until DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_availability_time CHECK (end_time > start_time),
    CONSTRAINT chk_availability_dates
        CHECK (effective_until IS NULL OR effective_from IS NULL OR effective_until >= effective_from),
    CONSTRAINT fk_availability_provider_tenant
        FOREIGN KEY (tenant_id, provider_id) REFERENCES providers(tenant_id, id)
);

CREATE INDEX idx_availability_provider
    ON provider_availability(tenant_id, provider_id, day_of_week);

CREATE TABLE provider_time_off (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_time_off_range CHECK (end_at > start_at),
    CONSTRAINT fk_time_off_provider_tenant
        FOREIGN KEY (tenant_id, provider_id) REFERENCES providers(tenant_id, id)
);

CREATE INDEX idx_time_off_provider
    ON provider_time_off(tenant_id, provider_id, start_at);
