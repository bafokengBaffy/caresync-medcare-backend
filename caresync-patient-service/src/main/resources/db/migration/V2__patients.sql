CREATE TABLE IF NOT EXISTS patients (
    id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id                 UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    first_name                VARCHAR(100) NOT NULL,
    last_name                 VARCHAR(100) NOT NULL,
    date_of_birth             DATE NOT NULL,
    gender                    VARCHAR(20),
    email                     VARCHAR(255),
    phone                     VARCHAR(20),
    address                   TEXT,
    emergency_contact_name    VARCHAR(200),
    emergency_contact_phone   VARCHAR(20),
    created_at                TIMESTAMPTZ DEFAULT NOW(),
    updated_at                TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);
CREATE INDEX IF NOT EXISTS idx_patients_tenant ON patients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(tenant_id, last_name, first_name);