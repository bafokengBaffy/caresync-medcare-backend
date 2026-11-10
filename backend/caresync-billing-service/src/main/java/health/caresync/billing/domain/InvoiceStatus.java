package health.caresync.billing.domain;

public enum InvoiceStatus {
    DRAFT,
    ISSUED,
    PARTIALLY_PAID,
    PAID,
    REFUNDED,
    PRO_BONO,
    VOID
}
