package health.caresync.patient.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record PatientSearchRequest(
    @Size(max = 200) String q,
    @Min(0) Integer page,
    @Min(1) @Max(100) Integer size
) {
    public PatientSearchCriteria toCriteria() {
        return new PatientSearchCriteria(
            q == null ? "" : q.trim(),
            page == null ? 0 : page,
            size == null ? 20 : size
        );
    }
}