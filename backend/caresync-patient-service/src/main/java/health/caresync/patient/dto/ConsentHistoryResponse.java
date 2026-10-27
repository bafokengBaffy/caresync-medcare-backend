package health.caresync.patient.dto;

import java.time.Instant;
import java.util.UUID;

public record ConsentHistoryResponse(
    UUID id,
    String action,
    String previousStatus,
    String newStatus,
    String reason,
    String actorUserId,
    String correlationId,
    Instant occurredAt
) {
}
