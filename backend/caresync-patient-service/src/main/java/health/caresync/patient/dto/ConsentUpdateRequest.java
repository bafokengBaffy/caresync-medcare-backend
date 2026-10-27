package health.caresync.patient.dto;

import jakarta.validation.constraints.Size;
import java.time.Instant;

public record ConsentUpdateRequest(
    @Size(max = 2000) String purpose,
    Instant expiresAt
) {
    public boolean hasChanges() {
        return purpose != null || expiresAt != null;
    }
}