package health.caresync.patient.dto.portal;

import java.time.Instant;
import java.util.UUID;

public record PatientInvoiceItem(
    UUID id,
    String invoiceNumber,
    long amountCents,
    String currency,
    String status,
    Instant issuedAt,
    Instant dueAt,
    Instant paidAt
) { }
