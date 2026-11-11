package health.caresync.patient.dto.admin;

import java.util.Map;

public record RoleConfigurationResponse(
    String id,
    String name,
    String description,
    boolean isSystem,
    String scope,
    Map<String, Boolean> permissions
) { }
