package health.caresync.billing.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record PaymentCreateRequest(
    @NotNull UUID invoiceId,
    @Positive long amountCents,
    @NotNull PaymentMethod method,
    @Size(max = 255) String externalReference
) {
}
