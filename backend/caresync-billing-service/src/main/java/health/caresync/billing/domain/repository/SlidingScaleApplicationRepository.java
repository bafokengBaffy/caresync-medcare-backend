package health.caresync.billing.domain.repository;

import health.caresync.billing.domain.entity.SlidingScaleApplication;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SlidingScaleApplicationRepository extends JpaRepository<SlidingScaleApplication, UUID> {
    boolean existsByTenantIdAndInvoiceId(UUID tenantId, UUID invoiceId);
}
