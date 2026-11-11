package health.caresync.patient.dto.admin;

import jakarta.validation.constraints.NotEmpty;
import java.util.Map;

public record UpdateRolePermissionsRequest(
    @NotEmpty Map<String, Boolean> permissions
) { }
