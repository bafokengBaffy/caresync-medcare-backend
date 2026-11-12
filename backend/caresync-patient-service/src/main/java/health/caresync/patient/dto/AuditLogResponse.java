package health.caresync.patient.dto;

import java.time.Instant;
import java.util.UUID;

public record AuditLogResponse(
    String id,
    UUID tenantId,
    String actorUserId,
    String actorRole,
    String action,
    String resourceType,
    String resourceId,
    String delta,
    String ipAddress,
    String userAgent,
    String requestId,
    Instant createdAt
) { }
