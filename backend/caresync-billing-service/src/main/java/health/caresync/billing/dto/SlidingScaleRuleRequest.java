package health.caresync.billing.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record SlidingScaleRuleRequest(
    @NotBlank @Size(max = 120) String name,
    @PositiveOrZero long minimumAnnualIncomeCents,
    @PositiveOrZero Long maximumAnnualIncomeCents,
    @NotNull @DecimalMin("0.00") @DecimalMax("100.00") BigDecimal discountPercentage,
    boolean active
) {
}
