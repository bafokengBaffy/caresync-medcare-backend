package health.caresync.patient.dto;
import java.util.UUID;
public record TenantResponse(UUID id, String name, String subdomain, boolean active) { }