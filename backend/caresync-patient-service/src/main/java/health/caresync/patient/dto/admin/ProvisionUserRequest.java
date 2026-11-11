package health.caresync.patient.dto.admin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Set;
import java.util.UUID;

public record ProvisionUserRequest(
    @Pattern(regexp = "[A-Za-z0-9._:-]{1,128}")
    String firebaseUid,
    @NotBlank
    @Email
    @Size(max = 320)
    String email,
    @NotBlank
    @Pattern(regexp = "SUPER_ADMIN|TENANT_ADMIN|ADMIN|PROVIDER|STAFF|RECEPTION|FINANCE|MANAGER|CONSENT_MANAGER|CLINICIAN|PRIVACY_OFFICER|RECEPTIONIST|PATIENT")
    String role,
    UUID tenantId,
    @NotBlank
    @Size(max = 200)
    String fullName,
    @Size(max = 32)
    String phone,
    @Pattern(regexp = "DENTAL|MENTAL_HEALTH|OPTOMETRY|NURSING|WELLNESS|COMMUNITY")
    String specialty,
    UUID patientId,
    @Size(max = 100)
    Set<@Pattern(regexp = "[A-Z][A-Z0-9_]{1,63}") String> permissions
) { }
