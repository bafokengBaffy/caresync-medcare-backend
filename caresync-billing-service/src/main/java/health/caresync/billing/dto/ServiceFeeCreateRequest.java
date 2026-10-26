package health.caresync.billing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record ServiceFeeCreateRequest(
    @NotBlank @Pattern(regexp = "[A-Z0-9_-]{1,32}") String code,
    @NotBlank @Size(max = 500) String description,
    @PositiveOrZero long unitPriceCents,
    @Pattern(regexp = "[A-Z]{3}") String currency
) {
}
