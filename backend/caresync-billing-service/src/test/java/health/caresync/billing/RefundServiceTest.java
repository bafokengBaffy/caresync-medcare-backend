package health.caresync.billing;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import health.caresync.billing.domain.Invoice;
import health.caresync.billing.domain.InvoiceRepository;
import health.caresync.billing.domain.InvoiceStatus;
import health.caresync.billing.domain.Payment;
import health.caresync.billing.domain.PaymentRepository;
import health.caresync.billing.domain.entity.Refund;
import health.caresync.billing.domain.enums.RefundStatus;
import health.caresync.billing.domain.repository.RefundRepository;
import health.caresync.billing.dto.RefundRequest;
import health.caresync.billing.service.BillingAuditService;
import health.caresync.billing.service.RefundService;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.tenant.TenantRlsContext;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class RefundServiceTest {
    @Test
    void rejectsRefundAboveRemainingPaymentAmount() {
        PaymentRepository payments = mock(PaymentRepository.class);
        InvoiceRepository invoices = mock(InvoiceRepository.class);
        RefundRepository refunds = mock(RefundRepository.class);
        TenantRlsContext tenantContext = mock(TenantRlsContext.class);
        BillingAuditService auditService = mock(BillingAuditService.class);
        RefundService service = new RefundService(
            payments,
            invoices,
            refunds,
            tenantContext,
            auditService
        );
        UUID tenantId = UUID.randomUUID();
        UUID paymentId = UUID.randomUUID();
        Payment payment = mock(Payment.class);
        Invoice invoice = mock(Invoice.class);

        when(tenantContext.apply()).thenReturn(tenantId);
        when(payments.findByIdAndTenantId(paymentId, tenantId)).thenReturn(Optional.of(payment));
        when(payment.getStatus()).thenReturn("RECORDED");
        when(payment.getId()).thenReturn(paymentId);
        when(payment.getAmountCents()).thenReturn(500L);
        when(payment.getInvoiceId()).thenReturn(UUID.randomUUID());
        when(invoices.findByIdAndTenantIdForUpdate(payment.getInvoiceId(), tenantId))
            .thenReturn(Optional.of(invoice));
        when(invoice.getStatus()).thenReturn(InvoiceStatus.PAID);
        when(refunds.sumProcessedByPayment(tenantId, paymentId, RefundStatus.PROCESSED))
            .thenReturn(400L);

        assertThrows(
            ValidationException.class,
            () -> service.refund(new RefundRequest(paymentId, 101L, "Duplicate payment"))
        );
        verify(refunds, never()).saveAndFlush(any(Refund.class));
    }

    @Test
    void updatesInvoiceToPartiallyPaidAfterRefund() {
        PaymentRepository payments = mock(PaymentRepository.class);
        InvoiceRepository invoices = mock(InvoiceRepository.class);
        RefundRepository refunds = mock(RefundRepository.class);
        TenantRlsContext tenantContext = mock(TenantRlsContext.class);
        BillingAuditService auditService = mock(BillingAuditService.class);
        RefundService service = new RefundService(
            payments,
            invoices,
            refunds,
            tenantContext,
            auditService
        );
        UUID tenantId = UUID.randomUUID();
        UUID paymentId = UUID.randomUUID();
        UUID invoiceId = UUID.randomUUID();
        Payment payment = mock(Payment.class);
        Invoice invoice = mock(Invoice.class);
        Refund savedRefund = mock(Refund.class);

        when(tenantContext.apply()).thenReturn(tenantId);
        when(payments.findByIdAndTenantId(paymentId, tenantId)).thenReturn(Optional.of(payment));
        when(payment.getStatus()).thenReturn("RECORDED");
        when(payment.getId()).thenReturn(paymentId);
        when(payment.getAmountCents()).thenReturn(1000L);
        when(payment.getInvoiceId()).thenReturn(invoiceId);
        when(invoices.findByIdAndTenantIdForUpdate(invoiceId, tenantId)).thenReturn(Optional.of(invoice));
        when(invoice.getId()).thenReturn(invoiceId);
        when(invoice.getStatus()).thenReturn(InvoiceStatus.PAID);
        when(invoice.getAmountCents()).thenReturn(1000L);
        when(refunds.sumProcessedByPayment(tenantId, paymentId, RefundStatus.PROCESSED)).thenReturn(0L);
        when(refunds.sumProcessedByInvoice(tenantId, invoiceId, RefundStatus.PROCESSED)).thenReturn(100L);
        when(payments.sumRecordedByInvoice(tenantId, invoiceId)).thenReturn(1000L);
        when(refunds.saveAndFlush(any(Refund.class))).thenAnswer(invocation -> {
            Refund refund = invocation.getArgument(0);
            when(savedRefund.getId()).thenReturn(UUID.randomUUID());
            when(savedRefund.getPaymentId()).thenReturn(refund.getPaymentId());
            when(savedRefund.getInvoiceId()).thenReturn(refund.getInvoiceId());
            when(savedRefund.getAmountCents()).thenReturn(refund.getAmountCents());
            when(savedRefund.getReason()).thenReturn(refund.getReason());
            when(savedRefund.getStatus()).thenReturn(refund.getStatus());
            when(savedRefund.getProcessedAt()).thenReturn(java.time.Instant.now());
            return savedRefund;
        });

        var response = service.refund(new RefundRequest(paymentId, 100L, "Customer request"));

        assertEquals(RefundStatus.PROCESSED, response.status());
        assertEquals(100L, response.amountCents());
        verify(invoice).setStatus(InvoiceStatus.PARTIALLY_PAID);
    }
}