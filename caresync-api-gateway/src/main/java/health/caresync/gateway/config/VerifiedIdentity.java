package health.caresync.gateway.config;

public record VerifiedIdentity(
    String userId,
    String tenantId,
    String role,
    String specialty
) {
}
