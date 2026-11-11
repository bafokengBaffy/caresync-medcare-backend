package health.caresync.common.constants;

public final class SecurityConstants {
    private SecurityConstants() {}
    public static final String BEARER_PREFIX = "Bearer ";
    public static final String CLAIM_TENANT_ID = "tenant_id";
    public static final String CLAIM_ROLES = "roles";
    public static final String CLAIM_PERMISSIONS = "permissions";
    public static final String CLAIM_MFA_VERIFIED = "mfa_verified";
}