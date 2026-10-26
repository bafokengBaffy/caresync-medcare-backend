package health.caresync.billing.domain;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    Optional<Invoice> findByIdAndTenantId(UUID id, UUID tenantId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from Invoice i where i.id = :id and i.tenantId = :tenantId")
    Optional<Invoice> findByIdAndTenantIdForUpdate(
        @Param("id") UUID id,
        @Param("tenantId") UUID tenantId
    );

    boolean existsByTenantIdAndInvoiceNumber(UUID tenantId, String invoiceNumber);
}
