package health.caresync.laboratory.dto;

import health.caresync.laboratory.domain.LabResultStatus;
import java.time.Instant;
import java.util.UUID;

public record LabResultResponse(
    UUID id,
    UUID tenantId,
    UUID patientId,
    UUID providerId,
    String testName,
    String testCode,
    LabResultStatus status,
    String resultValue,
    String unit,
    String referenceRange,
    String notes,
    Instant orderedAt,
    Instant resultedAt,
    Instant createdAt,
    Instant updatedAt
) { }
