package health.caresync.billing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

public record InvoiceItemRequest(
    @NotBlank @Pattern(regexp = "[A-Z0-9_-]{1,32}") String code,
    @Positive int quantity
) {
}
