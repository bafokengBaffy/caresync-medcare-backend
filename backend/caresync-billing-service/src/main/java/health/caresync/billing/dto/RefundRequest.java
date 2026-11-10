package health.caresync.billing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record RefundRequest(
    @NotNull UUID paymentId,
    @Positive long amountCents,
    @NotBlank @Size(max = 500) String reason
) {
}