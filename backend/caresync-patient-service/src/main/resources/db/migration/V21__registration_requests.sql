CREATE OR REPLACE FUNCTION current_user_is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(current_setting('app.is_super_admin', TRUE), 'false') = 'true';
END;
$$ LANGUAGE plpgsql STABLE;

CREATE TABLE registration_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(320) NOT NULL,
    firebase_uid VARCHAR(128) NOT NULL REFERENCES firebase_users(firebase_uid) ON DELETE CASCADE,
    requested_role VARCHAR(32) NOT NULL DEFAULT 'PATIENT'
        CHECK (requested_role IN (
            'ADMIN', 'PROVIDER', 'STAFF', 'RECEPTION', 'FINANCE', 'MANAGER',
            'CONSENT_MANAGER', 'CLINICIAN', 'PRIVACY_OFFICER', 'RECEPTIONIST',
            'TENANT_ADMIN', 'PATIENT'
        )),
    requested_tenant_id UUID REFERENCES tenants(id) ON DELETE RESTRICT,
    status VARCHAR(16) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_by VARCHAR(128) REFERENCES firebase_users(firebase_uid) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    rejection_reason VARCHAR(1000),
    CONSTRAINT registration_review_state CHECK (
        (status = 'PENDING' AND reviewed_at IS NULL AND rejection_reason IS NULL)
        OR (status = 'APPROVED' AND reviewed_at IS NOT NULL AND rejection_reason IS NULL)
        OR (status = 'REJECTED' AND reviewed_at IS NOT NULL AND rejection_reason IS NOT NULL)
    )
);

CREATE UNIQUE INDEX uq_registration_requests_pending_uid
    ON registration_requests(firebase_uid)
    WHERE status = 'PENDING';
CREATE INDEX idx_registration_requests_tenant_status_submitted
    ON registration_requests(requested_tenant_id, status, submitted_at DESC);
CREATE INDEX idx_registration_requests_email
    ON registration_requests(lower(email));
CREATE INDEX idx_registration_requests_firebase_uid
    ON registration_requests(firebase_uid);

ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_requests FORCE ROW LEVEL SECURITY;
CREATE POLICY registration_requests_tenant_access ON registration_requests
    FOR ALL
    USING (current_user_is_super_admin() OR requested_tenant_id = current_tenant_id())
    WITH CHECK (current_user_is_super_admin() OR requested_tenant_id = current_tenant_id());
CREATE POLICY registration_requests_self_read ON registration_requests
    FOR SELECT
    USING (firebase_uid = NULLIF(current_setting('app.firebase_uid', TRUE), ''));
CREATE POLICY registration_requests_self_create ON registration_requests
    FOR INSERT
    WITH CHECK (
        firebase_uid = NULLIF(current_setting('app.firebase_uid', TRUE), '')
        AND requested_role = 'PATIENT'
        AND status = 'PENDING'
        AND reviewed_by IS NULL
        AND reviewed_at IS NULL
        AND rejection_reason IS NULL
    );
