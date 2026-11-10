package health.caresync.patient.dto.admin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class AdminTenantDtos {
    private AdminTenantDtos() { }

    public record CreateRequest(
        @NotBlank @Size(max = 255) String name,
        @NotBlank @Pattern(regexp = "[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?") String subdomain,
        @Size(max = 1000) String description,
        @NotBlank @Size(max = 100) String timezone,
        @NotBlank @Size(max = 255) String ownerName,
        @NotBlank @Email @Size(max = 320) String ownerEmail,
        @Size(max = 32) String ownerPhone,
        @NotBlank @Pattern(regexp = "FREE|PRO|ENTERPRISE") String plan,
        @Size(max = 100) String country,
        @Size(max = 100) String city,
        @Size(max = 1000) String address
    ) { }

    public record StatusRequest(
        @NotBlank @Pattern(regexp = "ACTIVE|INACTIVE|SUSPENDED|PENDING") String status
    ) { }

    public record Summary(
        UUID id,
        String name,
        String subdomain,
        String status,
        String plan,
        String ownerEmail,
        long usersCount,
        long patientsCount,
        Long storageUsedMB,
        Instant createdAt,
        Instant updatedAt
    ) { }

    public record Page(
        List<Summary> content,
        long totalElements,
        int totalPages,
        int number,
        int size
    ) { }

    public record Stats(
        long totalUsers,
        long totalPatients,
        long monthlyAppointments,
        Long storageUsedMB,
        long invoicesThisMonth,
        long activeProviders
    ) { }

    public record Limits(
        Integer maxUsers,
        Integer maxPatients,
        Long storageLimitMB,
        Integer maxProviders,
        List<String> features
    ) { }

    public record User(
        String id,
        String name,
        String email,
        String role,
        String status,
        Instant lastLogin
    ) { }

    public record Audit(
        String id,
        String action,
        String actor,
        String entityType,
        Instant timestamp
    ) { }

    public record Detail(
        UUID id,
        String name,
        String subdomain,
        String description,
        String status,
        String plan,
        String timezone,
        String country,
        String city,
        String address,
        Instant createdAt,
        Instant updatedAt,
        String ownerEmail,
        String ownerName,
        String ownerPhone,
        Stats stats,
        Limits limits,
        List<User> recentUsers,
        List<Audit> recentAudit
    ) { }

    public record Provider(UUID id, String name, String specialisation) { }

    public record DetailBase(
        UUID id,
        String name,
        String subdomain,
        String description,
        String status,
        String plan,
        String timezone,
        String country,
        String city,
        String address,
        Instant createdAt,
        Instant updatedAt,
        String ownerEmail,
        String ownerName,
        String ownerPhone
    ) { }
}
