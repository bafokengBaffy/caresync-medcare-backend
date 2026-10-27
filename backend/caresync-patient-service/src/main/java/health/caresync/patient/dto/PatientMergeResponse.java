package health.caresync.patient.dto;

import java.time.Instant;
import java.util.UUID;

public record PatientMergeResponse(
    UUID id,
    UUID sourcePatientId,
    UUID targetPatientId,
    String status,
    String requesterUserId,
    String confirmerUserId,
    String requestReason,
    String decisionReason,
    Instant requestedAt,
    Instant confirmedAt,
    Instant cancelledAt,
    Instant reversedAt,
    long version
) {
}