package health.caresync.patient.dto;
import jakarta.validation.constraints.NotBlank;
public record TenantCreateRequest(@NotBlank String name, @NotBlank String subdomain) { }