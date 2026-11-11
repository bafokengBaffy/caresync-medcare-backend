package health.caresync.common.dto;

import java.time.Instant;

/** Immutable audit event payload. */
public record AuditEventDto(
        String tenantId, String actorId, String action, String entityType,
        String entityId, Instant occurredAt, String detail
) {}