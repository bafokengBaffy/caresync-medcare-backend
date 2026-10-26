package health.caresync.billing.domain;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceFeeRepository extends JpaRepository<ServiceFee, UUID> {
    Optional<ServiceFee> findByTenantIdAndCodeAndActiveTrue(UUID tenantId, String code);
}
