package health.caresync.patient.dto;
public record PatientSearchRequest(String q, Integer page, Integer size) { }