package health.caresync.patient.dto;
public record ProviderUpdateRequest(String firstName, String lastName, String licenseNumber, Boolean active) { }