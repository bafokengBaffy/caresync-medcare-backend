package health.caresync.patient.dto;

import jakarta.validation.constraints.Size;

public record MergeConfirmationRequest(@Size(max = 1000) String reason) {
}
