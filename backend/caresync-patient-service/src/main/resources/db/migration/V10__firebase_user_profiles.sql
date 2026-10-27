CREATE TABLE IF NOT EXISTS firebase_users (
    firebase_uid VARCHAR(128) PRIMARY KEY,
    email VARCHAR(320),
    role VARCHAR(32),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    disabled BOOLEAN NOT NULL DEFAULT FALSE,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_firebase_users_tenant
    ON firebase_users(tenant_id);
