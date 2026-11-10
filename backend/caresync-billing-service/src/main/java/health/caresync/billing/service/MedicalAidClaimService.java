package health.caresync.billing.service;

import health.caresync.billing.domain.Invoice;
import health.caresync.billing.domain.InvoiceRepository;
import health.caresync.billing.domain.InvoiceStatus;
import health.caresync.billing.domain.entity.MedicalAidClaim;
import health.caresync.billing.domain.enums.BillingAuditAction;
import health.caresync.billing.domain.enums.ClaimStatus;
import health.caresync.billing.domain.repository.MedicalAidClaimRepository;
import health.caresync.billing.dto.MedicalAidClaimDecisionRequest;
import health.caresync.billing.dto.MedicalAidClaimRequest;
import health.caresync.billing.dto.MedicalAidClaimResponse;
import health.caresync.common.exception.NotFoundException;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.tenant.TenantRlsContext;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MedicalAidClaimService {
    private final InvoiceRepository invoices;
    private final MedicalAidClaimRepository claims;
    private final TenantRlsContext tenantRlsContext;
    private final BillingAuditService auditService;

    public MedicalAidClaimService(
        InvoiceRepository invoices,
        MedicalAidClaimRepository claims,
        TenantRlsContext tenantRlsContext,
        BillingAuditService auditService
    ) {
        this.invoices = invoices;
        this.claims = claims;
        this.tenantRlsContext = tenantRlsContext;
        this.auditService = auditService;
    }

    @Transactional
    public MedicalAidClaimResponse submit(MedicalAidClaimRequest request) {
        UUID tenantId = tenantRlsContext.apply();
        if (request.claimAmountCents() <= 0) {
            throw new ValidationException("Claim amount must be greater than zero");
        }
        Invoice invoice = invoices.findByIdAndTenantId(request.invoiceId(), tenantId)
            .orElseThrow(() -> new NotFoundException("Invoice not found"));
        if (invoice.getStatus() == InvoiceStatus.DRAFT
            || invoice.getStatus() == InvoiceStatus.VOID
            || invoice.getStatus() == InvoiceStatus.REFUNDED
            || invoice.getStatus() == InvoiceStatus.PRO_BONO) {
            throw new ValidationException("Claims cannot be submitted for this invoice");
        }
        if (request.claimAmountCents() > invoice.getAmountCents()) {
            throw new ValidationException("Claim amount cannot exceed the invoice total");
        }

        MedicalAidClaim claim = new MedicalAidClaim();
        claim.setTenantId(tenantId);
        claim.setInvoiceId(invoice.getId());
        claim.setProviderName(request.providerName().trim());
        claim.setMemberNumber(request.memberNumber().trim());
        claim.setClaimAmountCents(request.claimAmountCents());
        claim.setCurrency(invoice.getCurrency());
        claim.setStatus(ClaimStatus.SUBMITTED);
        claim = claims.saveAndFlush(claim);
        auditService.record(
            tenantId,
            BillingAuditAction.MEDICAL_AID_CLAIM_SUBMITTED,
            "medical_aid_claim",
            claim.getId(),
            "Claim submitted for invoice " + invoice.getId()
        );
        return response(claim);
    }

    @Transactional
    public MedicalAidClaimResponse decide(UUID claimId, MedicalAidClaimDecisionRequest request) {
        UUID tenantId = tenantRlsContext.apply();
        if (request.status() != ClaimStatus.APPROVED && request.status() != ClaimStatus.REJECTED) {
            throw new ValidationException("A claim decision must be APPROVED or REJECTED");
        }
        if (request.status() == ClaimStatus.REJECTED
            && (request.decisionReason() == null || request.decisionReason().isBlank())) {
            throw new ValidationException("A rejection reason is required");
        }
        MedicalAidClaim claim = claims.findByIdAndTenantIdForUpdate(claimId, tenantId)
            .orElseThrow(() -> new NotFoundException("Medical aid claim not found"));
        if (claim.getStatus() != ClaimStatus.SUBMITTED) {
            throw new ValidationException("Only submitted claims can be decided");
        }
        claim.setStatus(request.status());
        claim.setDecisionReason(request.decisionReason() == null ? null : request.decisionReason().trim());
        claim.setDecisionAt(Instant.now());
        auditService.record(
            tenantId,
            BillingAuditAction.MEDICAL_AID_CLAIM_DECIDED,
            "medical_aid_claim",
            claim.getId(),
            "Claim decision: " + request.status()
        );
        return response(claim);
    }

    @Transactional(readOnly = true)
    public MedicalAidClaimResponse get(UUID id) {
        UUID tenantId = tenantRlsContext.apply();
        return claims.findByIdAndTenantId(id, tenantId)
            .map(MedicalAidClaimService::response)
            .orElseThrow(() -> new NotFoundException("Medical aid claim not found"));
    }

    @Transactional(readOnly = true)
    public List<MedicalAidClaimResponse> list() {
        UUID tenantId = tenantRlsContext.apply();
        return claims.findAllByTenantIdOrderBySubmittedAtDesc(tenantId)
            .stream()
            .map(MedicalAidClaimService::response)
            .toList();
    }

    private static MedicalAidClaimResponse response(MedicalAidClaim claim) {
        return new MedicalAidClaimResponse(
            claim.getId(),
            claim.getInvoiceId(),
            claim.getProviderName(),
            claim.getMemberNumber(),
            claim.getClaimAmountCents(),
            claim.getCurrency(),
            claim.getStatus(),
            claim.getDecisionReason(),
            claim.getSubmittedAt(),
            claim.getDecisionAt()
        );
    }
}