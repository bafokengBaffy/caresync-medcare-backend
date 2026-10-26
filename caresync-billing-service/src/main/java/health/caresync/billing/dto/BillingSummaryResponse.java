package health.caresync.billing.dto;

public record BillingSummaryResponse(long totalOutstandingCents, long totalPaidCents) {
}
