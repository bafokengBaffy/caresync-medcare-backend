package health.caresync.billing.domain;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    @Query("""
        select coalesce(sum(p.amountCents), 0)
        from Payment p
        where p.tenantId = :tenantId and p.invoiceId = :invoiceId and p.status = 'RECORDED'
        """)
    long sumRecordedByInvoice(
        @Param("tenantId") UUID tenantId,
        @Param("invoiceId") UUID invoiceId
    );
}
