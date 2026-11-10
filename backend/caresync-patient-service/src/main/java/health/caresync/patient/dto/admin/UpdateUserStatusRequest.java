package health.caresync.patient.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateUserStatusRequest(
    @NotBlank
    @Pattern(regexp = "ACTIVE|SUSPENDED")
    String status
) { }
