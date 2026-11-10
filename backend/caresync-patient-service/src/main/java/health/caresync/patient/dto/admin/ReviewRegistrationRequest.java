package health.caresync.patient.dto.admin;

import jakarta.validation.constraints.Size;
import java.util.UUID;

public record ReviewRegistrationRequest(
    UUID tenantId,
    UUID patientId,
    @Size(max = 1000)
    String reason
) { }
