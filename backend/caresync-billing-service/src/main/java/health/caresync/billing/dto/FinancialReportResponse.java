package health.caresync.billing.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record FinancialReportResponse(
        String id,
        String tenantId,
        String currency,
        Instant periodStart,
        Instant periodEnd,
        BigDecimal totalInvoiced,
        BigDecimal totalPaid,
        BigDecimal totalOutstanding,
        BigDecimal totalRefunds,
        Instant createdAt,
        String createdBy
) {}