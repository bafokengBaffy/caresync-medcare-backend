package health.caresync.billing.service;

import health.caresync.billing.domain.Invoice;
import health.caresync.billing.domain.InvoiceRepository;
import health.caresync.billing.domain.InvoiceStatus;
import health.caresync.billing.domain.Payment;
import health.caresync.billing.domain.PaymentRepository;
import health.caresync.billing.dto.PaymentCreateRequest;
import health.caresync.common.tenant.TenantRlsContext;
import java.time.Instant;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PaymentService {
    private final InvoiceRepository invoices;
    private final PaymentRepository payments;
    private final JdbcTemplate jdbcTemplate;
    private final TenantRlsContext tenantRlsContext;

    public PaymentService(
        InvoiceRepository invoices,
        PaymentRepository payments,
        JdbcTemplate jdbcTemplate,
        TenantRlsContext tenantRlsContext
    ) {
        this.invoices = invoices;
        this.payments = payments;
        this.jdbcTemplate = jdbcTemplate;
        this.tenantRlsContext = tenantRlsContext;
    }

    @Transactional
    public Payment record(PaymentCreateRequest request) {
        UUID tenantId = tenantRlsContext.apply();
        jdbcTemplate.queryForObject(
            "SELECT set_config('app.tenant_id', ?, true)",
            String.class,
            tenantId.toString()
        );

        Invoice invoice = invoices.findByIdAndTenantIdForUpdate(request.invoiceId(), tenantId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invoice not found"));
        if (invoice.getStatus() != InvoiceStatus.ISSUED
            && invoice.getStatus() != InvoiceStatus.PARTIALLY_PAID) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Invoice cannot accept payments");
        }
        if (request.amountCents() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment amount must be positive");
        }

        long netPaid = payments.sumNetPaidByInvoice(tenantId, invoice.getId());
        if (request.amountCents() > invoice.getAmountCents() - netPaid) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Payment exceeds the invoice balance");
        }

        Payment payment = new Payment();
        payment.setTenantId(tenantId);
        payment.setInvoiceId(invoice.getId());
        payment.setAmountCents(request.amountCents());
        payment.setCurrency(invoice.getCurrency());
        payment.setMethod(request.method().name());
        payment.setStatus("RECORDED");
        payment.setExternalRef(normalizeReference(request.externalReference()));
        payment.setPaidAt(Instant.now());
        Payment saved = payments.save(payment);

        long totalPaid = Math.addExact(netPaid, request.amountCents());
        if (totalPaid == invoice.getAmountCents()) {
            invoice.setStatus(InvoiceStatus.PAID);
            invoice.setPaidAt(payment.getPaidAt());
        } else {
            invoice.setStatus(InvoiceStatus.PARTIALLY_PAID);
        }
        invoices.save(invoice);
        return saved;
    }

    private String normalizeReference(String reference) {
        if (reference == null || reference.isBlank()) {
            return null;
        }
        String normalized = reference.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
