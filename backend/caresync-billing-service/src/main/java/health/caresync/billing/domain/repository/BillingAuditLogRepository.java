package health.caresync.billing.domain.repository;

import health.caresync.billing.domain.entity.BillingAuditLog;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BillingAuditLogRepository extends JpaRepository<BillingAuditLog, UUID> {
}