package health.caresync.billing.dto;

import health.caresync.billing.domain.InvoiceStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record SlidingScaleResponse(
    UUID invoiceId,
    UUID ruleId,
    String ruleName,
    long originalAmountCents,
    long discountAmountCents,
    long resultingAmountCents,
    BigDecimal discountPercentage,
    InvoiceStatus invoiceStatus,
    Instant appliedAt
) {
}