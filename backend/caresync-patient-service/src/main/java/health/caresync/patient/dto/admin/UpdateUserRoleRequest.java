package health.caresync.patient.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.util.Set;
import java.util.UUID;

public record UpdateUserRoleRequest(
    @NotBlank
    @Pattern(regexp = "TENANT_ADMIN|PROVIDER|STAFF|RECEPTION|FINANCE|MANAGER|CONSENT_MANAGER|CLINICIAN|PRIVACY_OFFICER|RECEPTIONIST|PATIENT")
    String role,
    UUID tenantId,
    @Pattern(regexp = "DENTAL|MENTAL_HEALTH|OPTOMETRY|NURSING|WELLNESS|COMMUNITY")
    String specialty,
    UUID patientId,
    Set<@Pattern(regexp = "[A-Z][A-Z0-9_]{1,63}") String> permissions
) { }
