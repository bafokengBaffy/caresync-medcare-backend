package health.caresync.gateway.config;

import java.util.Set;

import java.util.Set;

public record VerifiedIdentity(
    String userId,
    String tenantId,
    String role,
    String specialty,
    Boolean consentGranted,
    Long consentExpiresAt,
    Integer consentVersion
) {
    public VerifiedIdentity(String userId, String tenantId, String role, String specialty) {
        this(userId, tenantId, role, specialty, null, null, null);
    }

    public Set<String> roles() {
        return role == null || role.isBlank() ? Set.of() : Set.of(role);
    }
}