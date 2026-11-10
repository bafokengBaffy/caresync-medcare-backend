CREATE TABLE user_role_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid VARCHAR(128) NOT NULL
        REFERENCES firebase_users(firebase_uid) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL
        CHECK (role IN (
            'SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'PROVIDER', 'STAFF',
            'RECEPTION', 'FINANCE', 'MANAGER', 'CONSENT_MANAGER', 'CLINICIAN',
            'PRIVACY_OFFICER', 'RECEPTIONIST', 'PATIENT'
        )),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    assigned_by VARCHAR(128) REFERENCES firebase_users(firebase_uid) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_role_tenant_scope CHECK (
        (role = 'SUPER_ADMIN' AND tenant_id IS NULL)
        OR (role <> 'SUPER_ADMIN' AND tenant_id IS NOT NULL)
    )
);

CREATE UNIQUE INDEX uq_user_role_assignment_tenant
    ON user_role_assignments(firebase_uid, role, tenant_id)
    WHERE tenant_id IS NOT NULL;
CREATE UNIQUE INDEX uq_user_role_assignment_platform
    ON user_role_assignments(firebase_uid, role)
    WHERE tenant_id IS NULL;
CREATE INDEX idx_user_role_assignments_tenant_role
    ON user_role_assignments(tenant_id, role);
CREATE INDEX idx_user_role_assignments_firebase_uid
    ON user_role_assignments(firebase_uid);

CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid VARCHAR(128) NOT NULL
        REFERENCES firebase_users(firebase_uid) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    permission VARCHAR(64) NOT NULL
        CHECK (permission ~ '^[A-Z][A-Z0-9_]{1,63}$'),
    granted_by VARCHAR(128) REFERENCES firebase_users(firebase_uid) ON DELETE SET NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_permission_unique UNIQUE (firebase_uid, tenant_id, permission)
);

CREATE INDEX idx_user_permissions_tenant_uid
    ON user_permissions(tenant_id, firebase_uid);

ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments FORCE ROW LEVEL SECURITY;
CREATE POLICY user_role_assignments_tenant_access ON user_role_assignments
    FOR ALL
    USING (current_user_is_super_admin() OR tenant_id = current_tenant_id())
    WITH CHECK (current_user_is_super_admin() OR tenant_id = current_tenant_id());

ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions FORCE ROW LEVEL SECURITY;
CREATE POLICY user_permissions_tenant_access ON user_permissions
    FOR ALL
    USING (current_user_is_super_admin() OR tenant_id = current_tenant_id())
    WITH CHECK (current_user_is_super_admin() OR tenant_id = current_tenant_id());
