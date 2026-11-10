package health.caresync.patient.dto.portal;

import java.time.LocalDate;
import java.util.UUID;

public record PatientPortalProfile(
    UUID patientId,
    String firstName,
    String lastName,
    String email,
    String phone,
    LocalDate dateOfBirth,
    String tenantName
) { }
