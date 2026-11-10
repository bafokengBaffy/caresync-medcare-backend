package health.caresync.billing.service;

import health.caresync.billing.domain.Invoice;
import health.caresync.billing.domain.InvoiceRepository;
import health.caresync.billing.domain.InvoiceStatus;
import health.caresync.billing.domain.Payment;
import health.caresync.billing.domain.PaymentRepository;
import health.caresync.billing.domain.entity.Refund;
import health.caresync.billing.domain.enums.BillingAuditAction;
import health.caresync.billing.domain.enums.RefundStatus;
import health.caresync.billing.domain.repository.RefundRepository;
import health.caresync.billing.dto.RefundRequest;
import health.caresync.billing.dto.RefundResponse;
import health.caresync.common.exception.NotFoundException;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.tenant.TenantRlsContext;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RefundService {
    private final PaymentRepository payments;
    private final InvoiceRepository invoices;
    private final RefundRepository refunds;
    private final TenantRlsContext tenantRlsContext;
    private final BillingAuditService auditService;

    public RefundService(
        PaymentRepository payments,
        InvoiceRepository invoices,
        RefundRepository refunds,
        TenantRlsContext tenantRlsContext,
        BillingAuditService auditService
    ) {
        this.payments = payments;
        this.invoices = invoices;
        this.refunds = refunds;
        this.tenantRlsContext = tenantRlsContext;
        this.auditService = auditService;
    }

    @Transactional
    public RefundResponse refund(RefundRequest request) {
        UUID tenantId = tenantRlsContext.apply();
        if (request.amountCents() <= 0) {
            throw new ValidationException("Refund amount must be greater than zero");
        }
        Payment payment = payments.findByIdAndTenantId(request.paymentId(), tenantId)
            .orElseThrow(() -> new NotFoundException("Payment not found"));
        if (!"RECORDED".equals(payment.getStatus())) {
            throw new ValidationException("Only recorded payments can be refunded");
        }
        Invoice invoice = invoices.findByIdAndTenantIdForUpdate(payment.getInvoiceId(), tenantId)
            .orElseThrow(() -> new NotFoundException("Invoice not found"));
        if (invoice.getStatus() == InvoiceStatus.VOID || invoice.getStatus() == InvoiceStatus.DRAFT) {
            throw new ValidationException("Refunds cannot be processed for this invoice");
        }

        long alreadyRefundedFromPayment = refunds.sumProcessedByPayment(
            tenantId,
            payment.getId(),
            RefundStatus.PROCESSED
        );
        long paymentRefundTotal = addAmounts(alreadyRefundedFromPayment, request.amountCents());
        if (paymentRefundTotal > payment.getAmountCents()) {
            throw new ValidationException("Refund amount exceeds the remaining payment amount");
        }

        Refund refund = new Refund();
        refund.setTenantId(tenantId);
        refund.setPaymentId(payment.getId());
        refund.setInvoiceId(invoice.getId());
        refund.setAmountCents(request.amountCents());
        refund.setReason(request.reason().trim());
        refund = refunds.saveAndFlush(refund);

        long paid = payments.sumRecordedByInvoice(tenantId, invoice.getId());
        long refunded = refunds.sumProcessedByInvoice(
            tenantId,
            invoice.getId(),
            RefundStatus.PROCESSED
        );
        long netPaid = paid - refunded;
        invoice.setStatus(netPaid <= 0
            ? InvoiceStatus.REFUNDED
            : netPaid < invoice.getAmountCents()
                ? InvoiceStatus.PARTIALLY_PAID
                : InvoiceStatus.PAID);
        if (invoice.getStatus() != InvoiceStatus.PAID) {
            invoice.setPaidAt(null);
        }

        auditService.record(
            tenantId,
            BillingAuditAction.REFUND_PROCESSED,
            "refund",
            refund.getId(),
            "Refund of " + refund.getAmountCents() + " cents for payment " + payment.getId()
        );
        return response(refund);
    }

    @Transactional(readOnly = true)
    public List<RefundResponse> list() {
        UUID tenantId = tenantRlsContext.apply();
        return refunds.findAllByTenantIdOrderByProcessedAtDesc(tenantId)
            .stream()
            .map(RefundService::response)
            .toList();
    }

    private static long addAmounts(long first, long second) {
        try {
            return Math.addExact(first, second);
        } catch (ArithmeticException e) {
            throw new ValidationException("Refund total exceeds the supported amount");
        }
    }

    private static RefundResponse response(Refund refund) {
        return new RefundResponse(
            refund.getId(),
            refund.getPaymentId(),
            refund.getInvoiceId(),
            refund.getAmountCents(),
            refund.getReason(),
            refund.getStatus(),
            refund.getProcessedAt()
        );
    }
}