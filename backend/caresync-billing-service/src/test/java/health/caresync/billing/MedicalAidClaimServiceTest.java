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
import health.caresync.billing.domain.entity.MedicalAidClaim;
import health.caresync.billing.domain.enums.ClaimStatus;
import health.caresync.billing.domain.repository.MedicalAidClaimRepository;
import health.caresync.billing.dto.MedicalAidClaimRequest;
import health.caresync.billing.service.BillingAuditService;
import health.caresync.billing.service.MedicalAidClaimService;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.tenant.TenantRlsContext;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class MedicalAidClaimServiceTest {
    @Test
    void rejectsClaimAmountAboveInvoiceTotal() {
        InvoiceRepository invoices = mock(InvoiceRepository.class);
        MedicalAidClaimRepository claims = mock(MedicalAidClaimRepository.class);
        TenantRlsContext tenantContext = mock(TenantRlsContext.class);
        BillingAuditService auditService = mock(BillingAuditService.class);
        MedicalAidClaimService service = new MedicalAidClaimService(
            invoices,
            claims,
            tenantContext,
            auditService
        );
        UUID tenantId = UUID.randomUUID();
        UUID invoiceId = UUID.randomUUID();
        Invoice invoice = mock(Invoice.class);

        when(tenantContext.apply()).thenReturn(tenantId);
        when(invoices.findByIdAndTenantId(invoiceId, tenantId)).thenReturn(Optional.of(invoice));
        when(invoice.getId()).thenReturn(invoiceId);
        when(invoice.getStatus()).thenReturn(InvoiceStatus.ISSUED);
        when(invoice.getAmountCents()).thenReturn(1000L);

        assertThrows(
            ValidationException.class,
            () -> service.submit(new MedicalAidClaimRequest(invoiceId, "Aid Fund", "MEM-1", 1001))
        );
        verify(claims, never()).saveAndFlush(any(MedicalAidClaim.class));
    }

    @Test
    void submitsClaimInInvoiceCurrency() {
        InvoiceRepository invoices = mock(InvoiceRepository.class);
        MedicalAidClaimRepository claims = mock(MedicalAidClaimRepository.class);
        TenantRlsContext tenantContext = mock(TenantRlsContext.class);
        BillingAuditService auditService = mock(BillingAuditService.class);
        MedicalAidClaimService service = new MedicalAidClaimService(
            invoices,
            claims,
            tenantContext,
            auditService
        );
        UUID tenantId = UUID.randomUUID();
        UUID invoiceId = UUID.randomUUID();
        Invoice invoice = mock(Invoice.class);

        when(tenantContext.apply()).thenReturn(tenantId);
        when(invoices.findByIdAndTenantId(invoiceId, tenantId)).thenReturn(Optional.of(invoice));
        when(invoice.getId()).thenReturn(invoiceId);
        when(invoice.getStatus()).thenReturn(InvoiceStatus.ISSUED);
        when(invoice.getAmountCents()).thenReturn(1000L);
        when(invoice.getCurrency()).thenReturn("USD");
        when(claims.saveAndFlush(any(MedicalAidClaim.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.submit(new MedicalAidClaimRequest(invoiceId, " Aid Fund ", " MEM-1 ", 600));

        assertEquals(ClaimStatus.SUBMITTED, response.status());
        assertEquals("USD", response.currency());
        assertEquals("Aid Fund", response.providerName());
        assertEquals("MEM-1", response.memberNumber());
    }
}