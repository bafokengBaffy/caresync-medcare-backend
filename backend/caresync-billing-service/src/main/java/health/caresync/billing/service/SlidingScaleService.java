package health.caresync.billing.service;

import health.caresync.billing.domain.Invoice;
import health.caresync.billing.domain.InvoiceRepository;
import health.caresync.billing.domain.InvoiceStatus;
import health.caresync.billing.domain.PaymentRepository;
import health.caresync.billing.domain.entity.SlidingScaleApplication;
import health.caresync.billing.domain.entity.SlidingScaleRule;
import health.caresync.billing.domain.enums.BillingAuditAction;
import health.caresync.billing.domain.repository.SlidingScaleApplicationRepository;
import health.caresync.billing.domain.repository.SlidingScaleRuleRepository;
import health.caresync.billing.dto.SlidingScaleRequest;
import health.caresync.billing.dto.SlidingScaleResponse;
import health.caresync.billing.dto.SlidingScaleRuleRequest;
import health.caresync.billing.dto.SlidingScaleRuleResponse;
import health.caresync.common.exception.NotFoundException;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.tenant.TenantRlsContext;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SlidingScaleService {
    private final InvoiceRepository invoices;
    private final PaymentRepository payments;
    private final SlidingScaleRuleRepository rules;
    private final SlidingScaleApplicationRepository applications;
    private final TenantRlsContext tenantRlsContext;
    private final BillingAuditService auditService;

    public SlidingScaleService(
        InvoiceRepository invoices,
        PaymentRepository payments,
        SlidingScaleRuleRepository rules,
        SlidingScaleApplicationRepository applications,
        TenantRlsContext tenantRlsContext,
        BillingAuditService auditService
    ) {
        this.invoices = invoices;
        this.payments = payments;
        this.rules = rules;
        this.applications = applications;
        this.tenantRlsContext = tenantRlsContext;
        this.auditService = auditService;
    }

    @Transactional
    public SlidingScaleRuleResponse createRule(SlidingScaleRuleRequest request) {
        UUID tenantId = tenantRlsContext.apply();
        if (request.minimumAnnualIncomeCents() < 0
            || request.maximumAnnualIncomeCents() != null
                && request.maximumAnnualIncomeCents() <= request.minimumAnnualIncomeCents()) {
            throw new ValidationException("Income range must have a maximum greater than its minimum");
        }
        if (request.discountPercentage() == null
            || request.discountPercentage().compareTo(BigDecimal.ZERO) < 0
            || request.discountPercentage().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new ValidationException("Discount percentage must be between 0 and 100");
        }
        try {
            request.discountPercentage().setScale(2, RoundingMode.UNNECESSARY);
        } catch (ArithmeticException e) {
            throw new ValidationException("Discount percentage cannot have more than two decimal places");
        }
        if (request.active() && overlapsActiveRule(tenantId, request)) {
            throw new ValidationException("Active sliding-scale income ranges cannot overlap");
        }
        SlidingScaleRule rule = new SlidingScaleRule();
        rule.setTenantId(tenantId);
        rule.setName(request.name().trim());
        rule.setMinimumAnnualIncomeCents(request.minimumAnnualIncomeCents());
        rule.setMaximumAnnualIncomeCents(request.maximumAnnualIncomeCents());
        rule.setDiscountPercentage(request.discountPercentage().setScale(2, RoundingMode.UNNECESSARY));
        rule.setActive(request.active());
        rule = rules.saveAndFlush(rule);
        auditService.record(
            tenantId,
            BillingAuditAction.SLIDING_SCALE_RULE_CREATED,
            "sliding_scale_rule",
            rule.getId(),
            "Sliding-scale rule created: " + rule.getName()
        );
        return ruleResponse(rule);
    }

    @Transactional(readOnly = true)
    public List<SlidingScaleRuleResponse> listRules() {
        UUID tenantId = tenantRlsContext.apply();
        return rules.findAllByTenantIdOrderByMinimumAnnualIncomeCentsAsc(tenantId)
            .stream()
            .map(SlidingScaleService::ruleResponse)
            .toList();
    }

    @Transactional
    public SlidingScaleResponse apply(SlidingScaleRequest request) {
        UUID tenantId = tenantRlsContext.apply();
        if (request.annualHouseholdIncomeCents() < 0) {
            throw new ValidationException("Annual household income cannot be negative");
        }
        Invoice invoice = invoices.findByIdAndTenantIdForUpdate(request.invoiceId(), tenantId)
            .orElseThrow(() -> new NotFoundException("Invoice not found"));
        if (invoice.getStatus() != InvoiceStatus.ISSUED) {
            throw new ValidationException("Sliding-scale pricing can only be applied to an issued invoice");
        }
        if (payments.sumRecordedByInvoice(tenantId, invoice.getId()) > 0) {
            throw new ValidationException("Sliding-scale pricing cannot be applied after a payment is recorded");
        }
        if (applications.existsByTenantIdAndInvoiceId(tenantId, invoice.getId())) {
            throw new ValidationException("Sliding-scale pricing has already been applied to this invoice");
        }

        SlidingScaleRule rule = matchingRule(tenantId, request.annualHouseholdIncomeCents());
        long discount;
        try {
            discount = BigDecimal.valueOf(invoice.getAmountCents())
                .multiply(rule.getDiscountPercentage())
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP)
                .longValueExact();
        } catch (ArithmeticException e) {
            throw new ValidationException("Calculated discount exceeds the supported amount");
        }
        long result = invoice.getAmountCents() - discount;
        SlidingScaleApplication application = new SlidingScaleApplication();
        application.setTenantId(tenantId);
        application.setInvoiceId(invoice.getId());
        application.setRuleId(rule.getId());
        application.setOriginalAmountCents(invoice.getAmountCents());
        application.setDiscountAmountCents(discount);
        application.setResultingAmountCents(result);
        application = applications.saveAndFlush(application);

        invoice.setAmountCents(result);
        if (result == 0) {
            invoice.setStatus(InvoiceStatus.PRO_BONO);
        }
        auditService.record(
            tenantId,
            BillingAuditAction.SLIDING_SCALE_APPLIED,
            "invoice",
            invoice.getId(),
            "Rule " + rule.getId() + " applied; discount " + discount + " cents"
        );
        return new SlidingScaleResponse(
            invoice.getId(),
            rule.getId(),
            rule.getName(),
            application.getOriginalAmountCents(),
            application.getDiscountAmountCents(),
            application.getResultingAmountCents(),
            rule.getDiscountPercentage(),
            invoice.getStatus(),
            application.getAppliedAt()
        );
    }

    private boolean overlapsActiveRule(UUID tenantId, SlidingScaleRuleRequest candidate) {
        long candidateEnd = candidate.maximumAnnualIncomeCents() == null
            ? Long.MAX_VALUE
            : candidate.maximumAnnualIncomeCents();
        return rules.findAllByTenantIdAndActiveTrueOrderByMinimumAnnualIncomeCentsDesc(tenantId)
            .stream()
            .anyMatch(existing -> {
                long existingEnd = existing.getMaximumAnnualIncomeCents() == null
                    ? Long.MAX_VALUE
                    : existing.getMaximumAnnualIncomeCents();
                return candidate.minimumAnnualIncomeCents() < existingEnd
                    && existing.getMinimumAnnualIncomeCents() < candidateEnd;
            });
    }

    private SlidingScaleRule matchingRule(UUID tenantId, long incomeCents) {
        return rules.findAllByTenantIdAndActiveTrueOrderByMinimumAnnualIncomeCentsDesc(tenantId)
            .stream()
            .filter(rule -> incomeCents >= rule.getMinimumAnnualIncomeCents())
            .filter(rule -> rule.getMaximumAnnualIncomeCents() == null
                || incomeCents < rule.getMaximumAnnualIncomeCents())
            .findFirst()
            .orElseThrow(() -> new ValidationException("No sliding-scale rule matches this income"));
    }

    private static SlidingScaleRuleResponse ruleResponse(SlidingScaleRule rule) {
        return new SlidingScaleRuleResponse(
            rule.getId(),
            rule.getName(),
            rule.getMinimumAnnualIncomeCents(),
            rule.getMaximumAnnualIncomeCents(),
            rule.getDiscountPercentage(),
            rule.isActive(),
            rule.getCreatedAt(),
            rule.getUpdatedAt()
        );
    }
}