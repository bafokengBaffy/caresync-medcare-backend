package health.caresync.billing.service;

import health.caresync.billing.domain.Invoice;
import health.caresync.billing.domain.InvoiceRepository;
import health.caresync.billing.dto.BillingSummaryResponse;
import health.caresync.common.tenant.TenantRlsContext;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InvoiceQueryService {
    private final InvoiceRepository invoices;
    private final TenantRlsContext tenantRlsContext;
    private final JdbcTemplate jdbcTemplate;

    public InvoiceQueryService(
        InvoiceRepository invoices,
        TenantRlsContext tenantRlsContext,
        JdbcTemplate jdbcTemplate
    ) {
        this.invoices = invoices;
        this.tenantRlsContext = tenantRlsContext;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public Page<Invoice> list(Pageable pageable) {
        UUID tenantId = tenantRlsContext.apply();
        return invoices.findAllByTenantId(tenantId, pageable);
    }

    @Transactional(readOnly = true)
    public BillingSummaryResponse summary() {
        UUID tenantId = tenantRlsContext.apply();
        Long outstanding = jdbcTemplate.queryForObject(
            """
                SELECT COALESCE(SUM(i.amount_cents - COALESCE(p.paid_cents, 0)), 0)
                FROM invoices i
                LEFT JOIN (
                    SELECT invoice_id, SUM(amount_cents) AS paid_cents
                    FROM payments
                    WHERE tenant_id = ? AND status = 'RECORDED'
                    GROUP BY invoice_id
                ) p ON p.invoice_id = i.id
                WHERE i.tenant_id = ? AND i.status IN ('ISSUED', 'PARTIALLY_PAID')
                """,
            Long.class,
            tenantId,
            tenantId
        );
        Long paid = jdbcTemplate.queryForObject(
            "SELECT COALESCE(SUM(amount_cents), 0) FROM payments WHERE tenant_id = ? AND status = 'RECORDED'",
            Long.class,
            tenantId
        );
        return new BillingSummaryResponse(
            outstanding == null ? 0 : outstanding,
            paid == null ? 0 : paid
        );
    }
}
