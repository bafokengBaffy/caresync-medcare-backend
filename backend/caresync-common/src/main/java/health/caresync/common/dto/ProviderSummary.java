package health.caresync.common.dto;
import java.util.UUID;
public record ProviderSummary(UUID id, String firstName, String lastName, String specialty) { }