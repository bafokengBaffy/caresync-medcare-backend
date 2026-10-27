package health.caresync.patient.dto;

import java.util.UUID;

public record DuplicateSuggestion(
    UUID firstPatientId,
    String firstDisplayName,
    UUID secondPatientId,
    String secondDisplayName,
    double matchScore,
    String matchReason
) {
}
