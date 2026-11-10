package health.caresync.patient.dto;

import java.time.Instant;
import java.util.UUID;

public record PatientReferralResponse(
    UUID id,
    UUID patientId,
    String referralType,
    String recipientName,
    String recipientOrganization,
    String reason,
    String notes,
    String status,
    String createdBy,
    String updatedBy,
    Instant createdAt,
    Instant updatedAt
) { }
