package health.caresync.patient.dto.admin;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record BulkFixPendingActivationsRequest(
    @NotEmpty @Size(max = 100) List<String> ids
) { }
