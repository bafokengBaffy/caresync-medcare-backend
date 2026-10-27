package health.caresync.patient.dto;

import health.caresync.patient.domain.valueobject.RelationshipType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record GuardianCreateRequest(
    @NotBlank @Size(max = 128) String guardianUserId,
    @NotBlank @Size(max = 128) String fullName,
    @NotNull RelationshipType relationshipType,
    @Email @Size(max = 254) String email,
    @Size(max = 32) String phone,
    boolean primaryContact
) { }