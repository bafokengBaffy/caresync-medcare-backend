package health.caresync.billing.domain.repository;

import health.caresync.billing.domain.entity.Refund;
import health.caresync.billing.domain.enums.RefundStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RefundRepository extends JpaRepository<Refund, UUID> {
    List<Refund> findAllByTenantIdOrderByProcessedAtDesc(UUID tenantId);

    @Query("""
        select coalesce(sum(r.amountCents), 0)
        from Refund r
        where r.tenantId = :tenantId and r.paymentId = :paymentId and r.status = :status
        """)
    long sumProcessedByPayment(
        @Param("tenantId") UUID tenantId,
        @Param("paymentId") UUID paymentId,
        @Param("status") RefundStatus status
    );

    @Query("""
        select coalesce(sum(r.amountCents), 0)
        from Refund r
        where r.tenantId = :tenantId and r.invoiceId = :invoiceId and r.status = :status
        """)
    long sumProcessedByInvoice(
        @Param("tenantId") UUID tenantId,
        @Param("invoiceId") UUID invoiceId,
        @Param("status") RefundStatus status
    );
}