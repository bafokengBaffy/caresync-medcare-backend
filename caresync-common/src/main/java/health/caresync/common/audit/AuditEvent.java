package health.caresync.common.audit;
import java.time.Instant; import java.util.UUID;
public record AuditEvent(UUID tenantId, String actorUserId, String actorRole,
                         String action, String resourceType, String resourceId,
                         String delta, String ipAddress, String userAgent,
                         String requestId, Instant createdAt) { }