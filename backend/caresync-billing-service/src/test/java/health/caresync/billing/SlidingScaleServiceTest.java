package health.caresync.billing;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import health.caresync.billing.domain.Invoice;
import health.caresync.billing.domain.InvoiceRepository;
import health.caresync.billing.domain.InvoiceStatus;
import health.caresync.billing.domain.PaymentRepository;
import health.caresync.billing.domain.entity.SlidingScaleRule;
import health.caresync.billing.domain.repository.SlidingScaleApplicationRepository;
import health.caresync.billing.domain.repository.SlidingScaleRuleRepository;
import health.caresync.billing.dto.SlidingScaleRequest;
import health.caresync.billing.service.BillingAuditService;
import health.caresync.billing.service.SlidingScaleService;
import health.caresync.common.tenant.TenantRlsContext;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class SlidingScaleServiceTest {
    @Test
    void roundsDiscountToTheNearestCentAndUpdatesInvoice() {
        InvoiceRepository invoices = mock(InvoiceRepository.class);
        PaymentRepository payments = mock(PaymentRepository.class);
        SlidingScaleRuleRepository rules = mock(SlidingScaleRuleRepository.class);
        SlidingScaleApplicationRepository applications = mock(SlidingScaleApplicationRepository.class);
        TenantRlsContext tenantContext = mock(TenantRlsContext.class);
        BillingAuditService auditService = mock(BillingAuditService.class);
        SlidingScaleService service = new SlidingScaleService(
            invoices,
            payments,
            rules,
            applications,
            tenantContext,
            auditService
        );
        UUID tenantId = UUID.randomUUID();
        UUID invoiceId = UUID.randomUUID();
        Invoice invoice = new Invoice();
        invoice.setAmountCents(1001L);
        invoice.setStatus(InvoiceStatus.ISSUED);
        SlidingScaleRule rule = new SlidingScaleRule();
        rule.setName("Reduced income");
        rule.setMinimumAnnualIncomeCents(0);
        rule.setMaximumAnnualIncomeCents(500_000L);
        rule.setDiscountPercentage(new BigDecimal("50.00"));
        rule.setActive(true);

        when(tenantContext.apply()).thenReturn(tenantId);
        when(invoices.findByIdAndTenantIdForUpdate(invoiceId, tenantId)).thenReturn(Optional.of(invoice));
        when(payments.sumRecordedByInvoice(tenantId, invoiceId)).thenReturn(0L);
        when(applications.existsByTenantIdAndInvoiceId(tenantId, invoiceId)).thenReturn(false);
        when(rules.findAllByTenantIdAndActiveTrueOrderByMinimumAnnualIncomeCentsDesc(tenantId))
            .thenReturn(List.of(rule));
        when(applications.saveAndFlush(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.apply(new SlidingScaleRequest(invoiceId, 100_000));

        assertEquals(501L, response.discountAmountCents());
        assertEquals(500L, response.resultingAmountCents());
        assertEquals(500L, invoice.getAmountCents());
        assertEquals(InvoiceStatus.ISSUED, response.invoiceStatus());
        verify(auditService).record(
            tenantId,
            health.caresync.billing.domain.enums.BillingAuditAction.SLIDING_SCALE_APPLIED,
            "invoice",
            null,
            "Rule null applied; discount 501 cents"
        );
    }

    @Test
    void recordsOneHundredPercentDiscountAsProBono() {
        InvoiceRepository invoices = mock(InvoiceRepository.class);
        PaymentRepository payments = mock(PaymentRepository.class);
        SlidingScaleRuleRepository rules = mock(SlidingScaleRuleRepository.class);
        SlidingScaleApplicationRepository applications = mock(SlidingScaleApplicationRepository.class);
        TenantRlsContext tenantContext = mock(TenantRlsContext.class);
        SlidingScaleService service = new SlidingScaleService(
            invoices,
            payments,
            rules,
            applications,
            tenantContext,
            mock(BillingAuditService.class)
        );
        UUID tenantId = UUID.randomUUID();
        UUID invoiceId = UUID.randomUUID();
        Invoice invoice = new Invoice();
        invoice.setAmountCents(800L);
        invoice.setStatus(InvoiceStatus.ISSUED);
        SlidingScaleRule rule = new SlidingScaleRule();
        rule.setName("Full assistance");
        rule.setMinimumAnnualIncomeCents(0);
        rule.setDiscountPercentage(new BigDecimal("100.00"));
        rule.setActive(true);

        when(tenantContext.apply()).thenReturn(tenantId);
        when(invoices.findByIdAndTenantIdForUpdate(invoiceId, tenantId)).thenReturn(Optional.of(invoice));
        when(payments.sumRecordedByInvoice(tenantId, invoiceId)).thenReturn(0L);
        when(applications.existsByTenantIdAndInvoiceId(tenantId, invoiceId)).thenReturn(false);
        when(rules.findAllByTenantIdAndActiveTrueOrderByMinimumAnnualIncomeCentsDesc(tenantId))
            .thenReturn(List.of(rule));
        when(applications.saveAndFlush(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.apply(new SlidingScaleRequest(invoiceId, 0));

        assertEquals(0L, response.resultingAmountCents());
        assertEquals(InvoiceStatus.PRO_BONO, invoice.getStatus());
        assertEquals(InvoiceStatus.PRO_BONO, response.invoiceStatus());
    }
}
