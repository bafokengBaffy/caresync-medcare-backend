package health.caresync.billing.domain.repository;

import health.caresync.billing.domain.entity.PackageBilling;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PackageBillingRepository extends JpaRepository<PackageBilling, String> {
    List<PackageBilling> findAllByTenantIdOrderByCreatedAtDesc(String tenantId);

    Optional<PackageBilling> findByIdAndTenantId(String id, String tenantId);
}