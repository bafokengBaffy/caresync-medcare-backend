CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid VARCHAR(128) NOT NULL UNIQUE
        REFERENCES firebase_users(firebase_uid) ON DELETE CASCADE,
    full_name VARCHAR(200) NOT NULL DEFAULT '',
    phone VARCHAR(32),
    email VARCHAR(320) NOT NULL,
    profile_image_url TEXT,
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT user_profiles_email_not_blank CHECK (length(trim(email)) > 0),
    CONSTRAINT user_profiles_image_url_length CHECK (
        profile_image_url IS NULL OR length(profile_image_url) <= 2048
    )
);

CREATE INDEX idx_user_profiles_tenant ON user_profiles(tenant_id);
CREATE INDEX idx_user_profiles_firebase_uid ON user_profiles(firebase_uid);
CREATE INDEX idx_user_profiles_email ON user_profiles(lower(email));

CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_user_profiles_updated_at();

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles FORCE ROW LEVEL SECURITY;
CREATE POLICY user_profiles_tenant_access ON user_profiles
    FOR ALL
    USING (
        current_user_is_super_admin()
        OR tenant_id = current_tenant_id()
        OR firebase_uid = NULLIF(current_setting('app.firebase_uid', TRUE), '')
    )
    WITH CHECK (
        current_user_is_super_admin()
        OR tenant_id = current_tenant_id()
        OR firebase_uid = NULLIF(current_setting('app.firebase_uid', TRUE), '')
    );
