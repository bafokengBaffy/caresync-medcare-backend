package health.caresync.clinical.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {
    Optional<Appointment> findByIdAndTenantId(UUID id, UUID tenantId);
    Optional<Appointment> findByIdAndTenantIdAndProviderId(UUID id, UUID tenantId, UUID providerId);
    List<Appointment> findTop100ByTenantIdOrderByScheduledStartAsc(UUID tenantId);
    List<Appointment> findTop100ByTenantIdAndProviderIdOrderByScheduledStartAsc(
        UUID tenantId,
        UUID providerId
    );
}
