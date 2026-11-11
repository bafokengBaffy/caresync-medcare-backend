package health.caresync.patient.domain.repository;

import health.caresync.patient.domain.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import java.util.UUID;

/**
 * Repository for AuditLog data.
 * OWASP Alignment: Allows querying of audit trails for security investigations.
 * Note: Should be configured as append-only in the database layer.
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {
    Page<AuditLog> findAllByTenantId(UUID tenantId, Pageable pageable);
}
