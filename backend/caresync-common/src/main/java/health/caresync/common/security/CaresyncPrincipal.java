package health.caresync.common.security;
import java.util.UUID;

public record CaresyncPrincipal(String userId, UUID tenantId, String role, String specialty, String email) { }