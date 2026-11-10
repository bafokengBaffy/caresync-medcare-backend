package health.caresync.clinical.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record AnalyticsExportResponse(
    UUID tenantId,
    LocalDate fromDate,
    LocalDate toDate,
    int minimumCohortSize,
    Instant generatedAt,
    List<AnalyticsCohort> cohorts
) {
}
