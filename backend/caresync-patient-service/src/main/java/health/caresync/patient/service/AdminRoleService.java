package health.caresync.patient.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.patient.dto.admin.RoleConfigurationResponse;
import health.caresync.patient.dto.admin.UpdateRolePermissionsRequest;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

@Service
public class AdminRoleService {
    private static final Set<String> ROLES = Set.of(
        "SUPER_ADMIN", "TENANT_ADMIN", "PROVIDER", "STAFF", "RECEPTION",
        "FINANCE", "MANAGER", "CONSENT_MANAGER", "CLINICIAN", "PRIVACY_OFFICER",
        "RECEPTIONIST", "PATIENT"
    );
    private static final Set<String> PERMISSIONS = Set.of(
        "PATIENT_READ", "PATIENT_WRITE", "PATIENT_DELETE", "BILLING_READ",
        "BILLING_WRITE", "BILLING_DELETE", "APPOINTMENT_READ", "APPOINTMENT_WRITE",
        "CLINICAL_NOTE_READ", "CLINICAL_NOTE_WRITE", "USER_MANAGE", "TENANT_MANAGE",
        "AUDIT_READ", "SETTINGS_MANAGE"
    );
    private static final Pattern ROLE_FORMAT = Pattern.compile("[A-Z][A-Z0-9_]{1,31}");

    private final AdminConfigurationService configurations;
    private final ObjectMapper objectMapper;

    public AdminRoleService(AdminConfigurationService configurations, ObjectMapper objectMapper) {
        this.configurations = configurations;
        this.objectMapper = objectMapper;
    }

    public List<RoleConfigurationResponse> list(CaresyncPrincipal actor) {
        return ROLES.stream().sorted().map(role -> {
            JsonNode saved = configurations.getPlatform(actor, roleKey(role)).settings();
            Map<String, Boolean> permissions = defaults(role);
            if (saved.isObject()) {
                saved.fields().forEachRemaining(entry -> {
                    if (entry.getValue().isBoolean() && PERMISSIONS.contains(entry.getKey())) {
                        permissions.put(entry.getKey(), entry.getValue().booleanValue());
                    }
                });
            }
            String scope = role.equals("SUPER_ADMIN") ? "PLATFORM" : "TENANT";
            return new RoleConfigurationResponse(
                role, role, roleDescription(role), true, scope, Map.copyOf(permissions)
            );
        }).toList();
    }

    public RoleConfigurationResponse update(
        CaresyncPrincipal actor,
        String roleId,
        UpdateRolePermissionsRequest request
    ) {
        String role = roleId == null ? "" : roleId.toUpperCase();
        if (!ROLE_FORMAT.matcher(role).matches() || !ROLES.contains(role)) {
            throw new IllegalArgumentException("Unknown role");
        }
        if ("SUPER_ADMIN".equals(role)) {
            throw new IllegalArgumentException("SUPER_ADMIN permissions are immutable");
        }
        if (request.permissions().keySet().stream().anyMatch(permission -> !PERMISSIONS.contains(permission))) {
            throw new IllegalArgumentException("Unknown permission");
        }

        Map<String, Boolean> permissions = defaults(role);
        permissions.putAll(request.permissions());
        ObjectNode stored = objectMapper.createObjectNode();
        permissions.forEach(stored::put);
        String key = roleKey(role);
        long revision = configurations.getPlatform(actor, key).revision();
        configurations.putPlatform(actor, key, stored, revision);
        return new RoleConfigurationResponse(
            role, role, roleDescription(role), true, "TENANT", Map.copyOf(permissions)
        );
    }

    private static String roleKey(String role) {
        return "role:" + role;
    }

    private static Map<String, Boolean> defaults(String role) {
        Map<String, Boolean> permissions = new TreeMap<>();
        PERMISSIONS.forEach(permission -> permissions.put(permission, false));
        if ("SUPER_ADMIN".equals(role)) {
            permissions.put("USER_MANAGE", true);
            permissions.put("TENANT_MANAGE", true);
            permissions.put("AUDIT_READ", true);
            permissions.put("SETTINGS_MANAGE", true);
        } else if ("TENANT_ADMIN".equals(role)) {
            permissions.put("USER_MANAGE", true);
            permissions.put("AUDIT_READ", true);
            permissions.put("SETTINGS_MANAGE", true);
        } else if ("PROVIDER".equals(role) || "CLINICIAN".equals(role)) {
            permissions.put("PATIENT_READ", true);
            permissions.put("APPOINTMENT_READ", true);
            permissions.put("APPOINTMENT_WRITE", true);
            permissions.put("CLINICAL_NOTE_READ", true);
            permissions.put("CLINICAL_NOTE_WRITE", true);
        } else if ("FINANCE".equals(role)) {
            permissions.put("BILLING_READ", true);
            permissions.put("BILLING_WRITE", true);
        } else if ("RECEPTION".equals(role) || "RECEPTIONIST".equals(role) || "STAFF".equals(role)) {
            permissions.put("PATIENT_READ", true);
            permissions.put("APPOINTMENT_READ", true);
            permissions.put("APPOINTMENT_WRITE", true);
        } else if ("PRIVACY_OFFICER".equals(role)) {
            permissions.put("PATIENT_READ", true);
            permissions.put("AUDIT_READ", true);
        }
        return permissions;
    }

    private static String roleDescription(String role) {
        return switch (role) {
            case "SUPER_ADMIN" -> "Platform-wide administration";
            case "TENANT_ADMIN" -> "Administration for a single tenant";
            case "PROVIDER", "CLINICIAN" -> "Clinical care and documentation";
            case "FINANCE" -> "Billing and finance operations";
            case "RECEPTION", "RECEPTIONIST" -> "Front-desk and appointment operations";
            case "PRIVACY_OFFICER" -> "Privacy and audit oversight";
            case "CONSENT_MANAGER" -> "Patient consent administration";
            case "MANAGER" -> "Tenant operations management";
            case "STAFF" -> "Tenant staff access";
            default -> "Patient self-service access";
        };
    }
}
