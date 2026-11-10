package health.caresync.clinical.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record NursingAssessmentResponse(
    UUID id,
    UUID tenantId,
    UUID patientId,
    UUID providerId,
    LocalDate assessmentDate,
    String chiefComplaint,
    String findings,
    String carePlan,
    String notes,
    Instant createdAt,
    Instant updatedAt
) { }