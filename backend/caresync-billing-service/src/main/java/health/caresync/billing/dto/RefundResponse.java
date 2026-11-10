package health.caresync.billing.dto;

import health.caresync.billing.domain.enums.RefundStatus;
import java.time.Instant;
import java.util.UUID;

public record RefundResponse(
    UUID id,
    UUID paymentId,
    UUID invoiceId,
    long amountCents,
    String reason,
    RefundStatus status,
    Instant processedAt
) {
}