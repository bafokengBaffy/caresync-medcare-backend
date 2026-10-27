package health.caresync.patient.dto;

import java.time.Instant;
import java.util.UUID;

public record ConsentResponse(
    UUID id,
    UUID patientId,
    String consentType,
    String status,
    String purpose,
    Instant grantedAt,
    Instant expiresAt,
    Instant revokedAt,
    String revocationReason,
    String createdBy,
    String updatedBy,
    Instant createdAt,
    Instant updatedAt
) {
}