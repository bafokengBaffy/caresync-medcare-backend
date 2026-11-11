package health.caresync.billing.domain.enums;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Read-only audit projection.
 */
public record BillingAuditResponse(
        String id,
        String tenantId,
        String entityType,
        String entityId,
        String action,
        String actor,
        Instant occurredAt,
        BigDecimal amount,
        String detail
) {}