package health.caresync.clinical.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record EyeExamResponse(
    UUID id,
    UUID tenantId,
    UUID patientId,
    UUID providerId,
    LocalDate examDate,
    String rightEyeAcuity,
    String leftEyeAcuity,
    String diagnosis,
    String prescription,
    String notes,
    Instant createdAt,
    Instant updatedAt
) { }