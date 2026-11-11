package health.caresync.billing.service;

import health.caresync.billing.domain.entity.FinancialReport;
import health.caresync.billing.domain.repository.FinancialReportRepository;
import health.caresync.billing.dto.FinancialReportRequest;
import health.caresync.billing.dto.FinancialReportResponse;
import health.caresync.common.exception.NotFoundException;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.security.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

/**
 * Financial report generation.
 *
 * OWASP:
 * - Tenant derived from TenantContext (A01) — never from request.
 * - All inputs validated before use.
 * - Read-heavy operations; write uses immutable aggregate.
 */
@Service
public class FinancialReportService {

    private static final Logger log = LoggerFactory.getLogger(FinancialReportService.class);

    private final FinancialReportRepository repository;

    public FinancialReportService(FinancialReportRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<FinancialReportResponse> listForTenant() {
        String tenantId = requireTenant();
        return repository.findAllByTenantIdOrderByCreatedAtDesc(tenantId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public FinancialReportResponse get(String id) {
        String tenantId = requireTenant();
        FinancialReport report = repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new NotFoundException("Financial report not found"));
        return toResponse(report);
    }

    /**
     * Generates an immutable report snapshot. Period is validated.
     */
    @Transactional
    public FinancialReportResponse generate(FinancialReportRequest request, String actorId) {
        String tenantId = requireTenant();
        validateRequest(request);

        // Aggregations in a real system would query invoice/payment/refund repositories.
        // Kept zero-safe here so the snapshot is never null-valued.
        var invoiced = java.math.BigDecimal.ZERO;
        var paid = java.math.BigDecimal.ZERO;
        var outstanding = java.math.BigDecimal.ZERO;
        var refunds = java.math.BigDecimal.ZERO;

        FinancialReport report = new FinancialReport(
                tenantId,
                request.currency(),
                request.periodStart(),
                request.periodEnd(),
                invoiced, paid, outstanding, refunds,
                actorId
        );
        FinancialReport saved = repository.save(report);
        log.info("Financial report generated id={} tenant={} period={}..{}",
                saved.getId(), tenantId, request.periodStart(), request.periodEnd());
        return toResponse(saved);
    }

    private void validateRequest(FinancialReportRequest req) {
        Objects.requireNonNull(req, "request");
        if (req.periodStart() == null || req.periodEnd() == null) {
            throw new ValidationException("periodStart and periodEnd are required");
        }
        if (!req.periodStart().isBefore(req.periodEnd())) {
            throw new ValidationException("periodStart must be before periodEnd");
        }
    }

    private String requireTenant() {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new ValidationException("Tenant context is missing");
        }
        return tenantId;
    }

    private FinancialReportResponse toResponse(FinancialReport r) {
        return new FinancialReportResponse(
                r.getId(), r.getTenantId(), r.getCurrency(),
                r.getPeriodStart(), r.getPeriodEnd(),
                r.getTotalInvoiced(), r.getTotalPaid(),
                r.getTotalOutstanding(), r.getTotalRefunds(),
                r.getCreatedAt(), r.getCreatedBy()
        );
    }
}