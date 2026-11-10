package health.caresync.clinical.dto;

public record AnalyticsCohort(
    String ageBand,
    String genderGroup,
    String diagnosisSystem,
    String diagnosisCode,
    String appointmentFrequencyBand,
    long patientCount,
    double averageAppointments
) {
}
