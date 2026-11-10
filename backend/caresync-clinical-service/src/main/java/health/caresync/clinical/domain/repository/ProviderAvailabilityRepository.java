package health.caresync.clinical.domain.repository;

import health.caresync.clinical.domain.entity.ProviderAvailability;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProviderAvailabilityRepository extends JpaRepository<ProviderAvailability, UUID> {
    List<ProviderAvailability> findByTenantIdAndProviderIdAndDayOfWeekAndActiveTrue(
        UUID tenantId,
        UUID providerId,
        short dayOfWeek
    );
}
