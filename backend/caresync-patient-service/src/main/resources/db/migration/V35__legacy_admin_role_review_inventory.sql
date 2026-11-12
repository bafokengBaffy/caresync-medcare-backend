CREATE TABLE IF NOT EXISTS legacy_admin_role_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid VARCHAR(128) NOT NULL,
    legacy_tenant_id UUID,
    prior_role VARCHAR(32) NOT NULL DEFAULT 'ADMIN',
    review_status VARCHAR(24) NOT NULL DEFAULT 'NEEDS_REVIEW'
        CHECK (review_status IN ('NEEDS_REVIEW','MIGRATED','DISABLED')),
    migration_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    decision_source VARCHAR(160) NOT NULL DEFAULT 'automated-inventory-only',
    new_role VARCHAR(32),
    target_tenant_id UUID,
    reviewed_by VARCHAR(128),
    reviewed_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_legacy_admin_review_identity_tenant
    ON legacy_admin_role_reviews(firebase_uid, COALESCE(legacy_tenant_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Inventory legacy account/tenant references without changing roles, claims,
-- assignment rows, or access. Each account requires an explicit review decision.
INSERT INTO legacy_admin_role_reviews(firebase_uid, legacy_tenant_id)
SELECT firebase_uid, tenant_id FROM firebase_users WHERE role = 'ADMIN'
UNION
SELECT firebase_uid, tenant_id FROM user_role_assignments WHERE role = 'ADMIN'
ON CONFLICT DO NOTHING;

-- Quarantine ambiguous legacy rows from normal RLS queries while retaining
-- their original role and assignment for the explicit review workflow.
CREATE POLICY legacy_admin_review_inventory_access ON legacy_admin_role_reviews
    FOR ALL
    USING (current_user_is_super_admin())
    WITH CHECK (current_user_is_super_admin());

ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments FORCE ROW LEVEL SECURITY;
CREATE POLICY firebase_users_exclude_legacy_admin ON firebase_users
    FOR SELECT
    USING (role IS DISTINCT FROM 'ADMIN' OR current_user_is_super_admin());

CREATE POLICY user_role_assignments_exclude_legacy_admin ON user_role_assignments
    AS RESTRICTIVE FOR SELECT
    USING (role IS DISTINCT FROM 'ADMIN' OR current_user_is_super_admin());
CREATE POLICY user_role_assignments_tenant_scope ON user_role_assignments
    FOR ALL
    USING (current_user_is_super_admin() OR tenant_id = current_tenant_id())
    WITH CHECK (current_user_is_super_admin() OR tenant_id = current_tenant_id());
ALTER TABLE legacy_admin_role_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_admin_role_reviews FORCE ROW LEVEL SECURITY;

-- Keep historical rows reviewable, but prevent any new generic ADMIN role assignment.
CREATE OR REPLACE FUNCTION reject_new_generic_admin_role()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'ADMIN' THEN
        RAISE EXCEPTION 'Generic ADMIN role assignments are disabled; use an approved canonical role';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reject_generic_admin_firebase_users ON firebase_users;
CREATE TRIGGER trg_reject_generic_admin_firebase_users
BEFORE INSERT OR UPDATE OF role ON firebase_users
FOR EACH ROW EXECUTE FUNCTION reject_new_generic_admin_role();

DROP TRIGGER IF EXISTS trg_reject_generic_admin_role_assignments ON user_role_assignments;
CREATE TRIGGER trg_reject_generic_admin_role_assignments
BEFORE INSERT OR UPDATE OF role ON user_role_assignments
FOR EACH ROW EXECUTE FUNCTION reject_new_generic_admin_role();
