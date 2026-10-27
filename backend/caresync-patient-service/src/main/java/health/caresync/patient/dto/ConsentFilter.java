package health.caresync.patient.dto;

import java.time.LocalDate;

public record ConsentFilter(
    String consentType,
    String status,
    LocalDate from,
    LocalDate to
) {
}
