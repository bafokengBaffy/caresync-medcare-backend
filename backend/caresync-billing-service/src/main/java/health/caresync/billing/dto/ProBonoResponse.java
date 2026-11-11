package health.caresync.billing.dto;

import java.time.Instant;

public record ProBonoResponse(
        String id,
        String tenantId,
        String patientId,
        String serviceCode,
        String reason,
        String approvedBy,
        Instant approvedAt
) {}