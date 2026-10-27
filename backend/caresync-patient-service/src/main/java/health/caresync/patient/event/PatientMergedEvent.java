package health.caresync.patient.event;

import java.time.Instant;
import java.util.UUID;

public record PatientMergedEvent(
    UUID tenantId,
    UUID mergeId,
    UUID sourcePatientId,
    UUID targetPatientId,
    String actorUserId,
    String action,
    Instant occurredAt
) {
}