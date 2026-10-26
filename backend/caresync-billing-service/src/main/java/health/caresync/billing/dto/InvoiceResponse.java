package health.caresync.billing.dto;

import health.caresync.billing.domain.InvoiceStatus;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record InvoiceResponse(
    UUID id,
    String invoiceNumber,
    UUID patientId,
    UUID appointmentId,
    long amountCents,
    String currency,
    InvoiceStatus status,
    Instant issuedAt,
    List<InvoiceLineResponse> items
) {
}
