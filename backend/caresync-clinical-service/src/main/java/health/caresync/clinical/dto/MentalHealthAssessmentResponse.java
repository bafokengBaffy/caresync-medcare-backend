package health.caresync.clinical.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record MentalHealthAssessmentResponse(
    UUID id,
    UUID tenantId,
    UUID patientId,
    UUID providerId,
    LocalDate assessmentDate,
    String assessmentTool,
    Integer score,
    String findings,
    String riskLevel,
    String carePlan,
    String notes,
    Instant createdAt,
    Instant updatedAt
) { }