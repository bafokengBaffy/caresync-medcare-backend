package health.caresync.billing.domain;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvoiceLineItemRepository extends JpaRepository<InvoiceLineItem, UUID> {
    List<InvoiceLineItem> findAllByTenantIdAndInvoiceId(UUID tenantId, UUID invoiceId);
}
