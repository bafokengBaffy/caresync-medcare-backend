CREATE TABLE admin_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scope VARCHAR(16) NOT NULL CHECK (scope IN ('PLATFORM', 'TENANT')),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    configuration_key VARCHAR(100) NOT NULL,
    configuration_value TEXT NOT NULL,
    updated_by VARCHAR(128) REFERENCES firebase_users(firebase_uid) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT admin_configuration_scope_tenant CHECK (
        (scope = 'PLATFORM' AND tenant_id IS NULL)
        OR (scope = 'TENANT' AND tenant_id IS NOT NULL)
    )
);

CREATE UNIQUE INDEX uq_admin_configuration_platform
    ON admin_configurations(configuration_key) WHERE tenant_id IS NULL;
CREATE UNIQUE INDEX uq_admin_configuration_tenant
    ON admin_configurations(tenant_id, configuration_key) WHERE tenant_id IS NOT NULL;

ALTER TABLE admin_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_configurations FORCE ROW LEVEL SECURITY;
CREATE POLICY admin_configurations_scope_access ON admin_configurations
    FOR ALL
    USING (
        (scope = 'PLATFORM' AND current_user_is_super_admin())
        OR (scope = 'TENANT' AND tenant_id = current_tenant_id())
    )
    WITH CHECK (
        (scope = 'PLATFORM' AND current_user_is_super_admin())
        OR (scope = 'TENANT' AND tenant_id = current_tenant_id())
    );
