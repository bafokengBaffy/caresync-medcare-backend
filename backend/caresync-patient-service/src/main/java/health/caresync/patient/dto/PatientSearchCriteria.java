package health.caresync.patient.dto;

public record PatientSearchCriteria(String query, int page, int size) { }