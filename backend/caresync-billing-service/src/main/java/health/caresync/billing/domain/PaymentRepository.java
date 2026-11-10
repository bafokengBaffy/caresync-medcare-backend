package health.caresync.billing.domain;

import java.util.UUID;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    Page<Payment> findAllByTenantId(UUID tenantId, Pageable pageable);
    Optional<Payment> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query("""
        select coalesce(sum(p.amountCents), 0)
        from Payment p
        where p.tenantId = :tenantId and p.invoiceId = :invoiceId and p.status = 'RECORDED'
        """)
    long sumRecordedByInvoice(
        @Param("tenantId") UUID tenantId,
        @Param("invoiceId") UUID invoiceId
    );

    @Query(value = """
        select greatest(
            coalesce((select sum(p.amount_cents) from payments p
                where p.tenant_id = :tenantId and p.invoice_id = :invoiceId and p.status = 'RECORDED'), 0)
            - coalesce((select sum(r.amount_cents) from refunds r
                where r.tenant_id = :tenantId and r.invoice_id = :invoiceId and r.status = 'PROCESSED'), 0),
            0
        )
        """, nativeQuery = true)
    long sumNetPaidByInvoice(
        @Param("tenantId") UUID tenantId,
        @Param("invoiceId") UUID invoiceId
    );
}
