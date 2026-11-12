CREATE TABLE IF NOT EXISTS admin_integration_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id VARCHAR(64) NOT NULL,
    action VARCHAR(32) NOT NULL,
    actor_id VARCHAR(128) NOT NULL,
    actor_name VARCHAR(320) NOT NULL DEFAULT '',
    description VARCHAR(1000) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_integration_events_service_time
    ON admin_integration_events(service_id, occurred_at DESC);
