package health.caresync.billing.dto;

import java.time.Instant;
import java.util.UUID;

public record PaymentResponse(
    UUID id,
    UUID invoiceId,
    long amountCents,
    String currency,
    PaymentMethod method,
    Instant paidAt
) {
}
