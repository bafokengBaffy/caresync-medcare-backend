package health.caresync.common.security;

import java.util.UUID;

/**
 * Thread-local tenant context. Always clear in finally/afterCompletion
 * to prevent context leak between pooled threads (OWASP A01).
 */
public final class TenantContext {
    private static final ThreadLocal<String> TENANT_ID = new ThreadLocal<>();
    private static final ThreadLocal<String> USER_ID = new ThreadLocal<>();
    private static final ThreadLocal<String> ROLE = new ThreadLocal<>();

    private TenantContext() {}

    public static void setTenantId(String id) { TENANT_ID.set(id); }
    public static String getTenantId() { return TENANT_ID.get(); }

    public static void set(UUID id) { setTenantId(id == null ? null : id.toString()); }

    public static UUID get() {
        String tenantId = getTenantId();
        if (tenantId == null) {
            return null;
        }
        try {
            return UUID.fromString(tenantId);
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }

    public static UUID require() {
        UUID tenantId = get();
        if (tenantId == null) {
            throw new IllegalStateException("A valid tenant ID is required");
        }
        return tenantId;
    }

    public static void setUserId(String userId) { USER_ID.set(userId); }
    public static String getUserId() { return USER_ID.get(); }
    public static void setRole(String role) { ROLE.set(role); }
    public static String getRole() { return ROLE.get(); }

    public static void clear() {
        TENANT_ID.remove();
        USER_ID.remove();
        ROLE.remove();
    }
}