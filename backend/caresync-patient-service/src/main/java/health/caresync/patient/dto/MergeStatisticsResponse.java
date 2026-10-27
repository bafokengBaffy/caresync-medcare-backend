package health.caresync.patient.dto;

public record MergeStatisticsResponse(
    long totalMerges,
    long pendingMerges,
    long confirmedMerges,
    long cancelledMerges,
    long reversedMerges,
    long uniquePairsSuggested
) {
}
