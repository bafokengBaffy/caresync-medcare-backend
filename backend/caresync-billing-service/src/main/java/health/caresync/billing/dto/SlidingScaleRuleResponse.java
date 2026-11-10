package health.caresync.billing.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record SlidingScaleRuleResponse(
    UUID id,
    String name,
    long minimumAnnualIncomeCents,
    Long maximumAnnualIncomeCents,
    BigDecimal discountPercentage,
    boolean active,
    Instant createdAt,
    Instant updatedAt
) {
}
