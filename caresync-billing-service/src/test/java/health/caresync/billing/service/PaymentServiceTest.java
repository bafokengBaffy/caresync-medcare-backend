package health.caresync.billing.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import health.caresync.billing.domain.Invoice;
import health.caresync.billing.domain.InvoiceRepository;
import health.caresync.billing.domain.InvoiceStatus;
import health.caresync.billing.domain.Payment;
import health.caresync.billing.domain.PaymentRepository;
import health.caresync.billing.dto.PaymentCreateRequest;
import health.caresync.billing.dto.PaymentMethod;
import health.caresync.common.tenant.TenantRlsContext;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.jdbc.core.JdbcTemplate;

class PaymentServiceTest {
    @Test
    void recordsPaymentInTheInvoiceCurrency() {
        InvoiceRepository invoices = mock(InvoiceRepository.class);
        PaymentRepository payments = mock(PaymentRepository.class);
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        TenantRlsContext tenantRlsContext = mock(TenantRlsContext.class);
        UUID tenantId = UUID.randomUUID();
        UUID invoiceId = UUID.randomUUID();
        Payment persistedPayment = mock(Payment.class);
        Invoice invoice = mock(Invoice.class);

        when(tenantRlsContext.apply()).thenReturn(tenantId);
        when(invoices.findByIdAndTenantIdForUpdate(invoiceId, tenantId))
            .thenReturn(Optional.of(invoice));
        when(invoice.getId()).thenReturn(invoiceId);
        when(invoice.getStatus()).thenReturn(InvoiceStatus.ISSUED);
        when(invoice.getAmountCents()).thenReturn(1000L);
        when(invoice.getCurrency()).thenReturn("USD");
        when(payments.sumRecordedByInvoice(tenantId, invoiceId)).thenReturn(0L);
        when(persistedPayment.getId()).thenReturn(UUID.randomUUID());
        when(payments.save(any(Payment.class))).thenReturn(persistedPayment);

        PaymentService service = new PaymentService(invoices, payments, jdbcTemplate, tenantRlsContext);
        service.record(new PaymentCreateRequest(invoiceId, 100L, PaymentMethod.CASH, null));

        ArgumentCaptor<Payment> paymentCaptor = ArgumentCaptor.forClass(Payment.class);
        verify(payments).save(paymentCaptor.capture());
        assertEquals("USD", paymentCaptor.getValue().getCurrency());
    }
}
