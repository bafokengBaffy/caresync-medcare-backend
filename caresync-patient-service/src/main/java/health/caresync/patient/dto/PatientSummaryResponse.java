package health.caresync.patient.dto;
import java.util.UUID;
import java.time.LocalDate;
public record PatientSummaryResponse(
    UUID id,
    String firstName,
    String lastName,
    LocalDate dateOfBirth,
    String email,
    String phone
) { }