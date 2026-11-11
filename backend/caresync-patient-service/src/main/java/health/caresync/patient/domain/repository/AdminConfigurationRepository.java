package health.caresync.patient.domain.repository;

import health.caresync.patient.domain.entity.AdminConfiguration;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminConfigurationRepository extends JpaRepository<AdminConfiguration, UUID> {
    Optional<AdminConfiguration> findByScopeAndConfigurationKeyAndTenantIdIsNull(
        String scope, String configurationKey
    );

    Optional<AdminConfiguration> findByScopeAndConfigurationKeyAndTenantId(
        String scope, String configurationKey, UUID tenantId
    );
}
