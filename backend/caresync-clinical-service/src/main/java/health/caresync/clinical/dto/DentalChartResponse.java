package health.caresync.clinical.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record DentalChartResponse(
    UUID id,
    UUID tenantId,
    UUID patientId,
    UUID providerId,
    LocalDate chartDate,
    String findings,
    String treatmentPlan,
    String notes,
    Instant createdAt,
    Instant updatedAt
) { }