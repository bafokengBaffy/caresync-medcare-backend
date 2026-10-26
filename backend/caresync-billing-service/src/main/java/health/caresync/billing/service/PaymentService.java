package health.caresync.billing.service;

import health.caresync.billing.domain.Invoice;
import health.caresync.billing.domain.InvoiceRepository;
import health.caresync.billing.domain.InvoiceStatus;
import health.caresync.billing.domain.Payment;
import health.caresync.billing.domain.PaymentRepository;
import health.caresync.billing.dto.PaymentCreateRequest;
import health.caresync.billing.dto.PaymentResponse;
import health.caresync.common.exception.NotFoundException;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.tenant.TenantRlsContext;
import java.time.Instant;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    public PaymentResponse record(PaymentCreateRequest request) {
        UUID tenantId = tenantRlsContext.apply();
        Invoice invoice = invoices.findByIdAndTenantIdForUpdate(request.invoiceId(), tenantId)
            .orElseThrow(() -> new NotFoundException("Invoice not found"));
        if (invoice.getStatus() == InvoiceStatus.VOID || invoice.getStatus() == InvoiceStatus.DRAFT) {
            throw new ValidationException("Payments cannot be recorded against this invoice");
        }

        long alreadyPaid = payments.sumRecordedByInvoice(tenantId, invoice.getId());
        long newTotal;
        try {
            newTotal = Math.addExact(alreadyPaid, request.amountCents());
        } catch (ArithmeticException e) {
            throw new ValidationException("Payment total exceeds the supported amount");
        }
        if (newTotal > invoice.getAmountCents()) {
            throw new ValidationException("Payment exceeds the outstanding invoice balance");
        }

        Instant paidAt = Instant.now();
        Payment payment = new Payment();
        payment.setTenantId(tenantId);
        payment.setInvoiceId(invoice.getId());
        payment.setAmountCents(request.amountCents());
        payment.setCurrency(invoice.getCurrency());
        payment.setMethod(request.method().name());
        payment.setExternalRef(request.externalReference());
        payment.setPaidAt(paidAt);
        payment = payments.save(payment);

        invoice.setStatus(newTotal == invoice.getAmountCents()
            ? InvoiceStatus.PAID
            : InvoiceStatus.PARTIALLY_PAID);
        if (invoice.getStatus() == InvoiceStatus.PAID) {
            invoice.setPaidAt(paidAt);
        }
        jdbcTemplate.update(
            "insert into audit_logs (tenant_id, action, resource_type, resource_id) values (?, 'PAYMENT_RECORDED', 'payment', ?)",
            tenantId,
            payment.getId().toString()
        );
        return new PaymentResponse(
            payment.getId(),
            payment.getInvoiceId(),
            payment.getAmountCents(),
            payment.getCurrency(),
            request.method(),
            payment.getPaidAt()
        );
    }
}
