package health.caresync.billing.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.util.UUID;

public record SlidingScaleRequest(
    @NotNull UUID invoiceId,
    @PositiveOrZero long annualHouseholdIncomeCents
) {
}