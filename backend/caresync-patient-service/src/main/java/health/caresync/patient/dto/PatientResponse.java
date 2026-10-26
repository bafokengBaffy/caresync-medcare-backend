package health.caresync.patient.dto;
import java.time.*;
import java.util.UUID;
public record PatientResponse(UUID id, String firstName, String lastName, LocalDate dateOfBirth, String email, Instant createdAt) { }