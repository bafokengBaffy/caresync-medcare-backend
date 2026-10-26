package health.caresync.common.dto;
import java.util.UUID;
public record TenantSummary(UUID id, String name, String subdomain, boolean active) { }