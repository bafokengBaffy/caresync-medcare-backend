ALTER TABLE audit_logs
    ALTER COLUMN tenant_id DROP NOT NULL;

DROP POLICY IF EXISTS tenant_isolation_audit ON audit_logs;
CREATE POLICY tenant_isolation_audit ON audit_logs
    FOR ALL
    USING (current_user_is_super_admin() OR tenant_id = current_tenant_id())
    WITH CHECK (current_user_is_super_admin() OR tenant_id = current_tenant_id());
