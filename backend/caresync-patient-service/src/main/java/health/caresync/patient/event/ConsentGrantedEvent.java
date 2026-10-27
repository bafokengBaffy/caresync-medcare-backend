package health.caresync.patient.event;

import java.time.Instant;
import java.util.UUID;

public record ConsentGrantedEvent(
    UUID tenantId,
    UUID patientId,
    UUID consentId,
    String consentType,
    String actorUserId,
    Instant occurredAt
) {
}