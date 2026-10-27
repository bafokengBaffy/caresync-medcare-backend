package health.caresync.patient.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MergeReverseRequest(@NotBlank @Size(max = 1000) String reason) {
}
