package health.caresync.billing.dto;

public record InvoiceLineResponse(
    String code,
    String description,
    int quantity,
    long unitPriceCents,
    long totalCents
) {
}
