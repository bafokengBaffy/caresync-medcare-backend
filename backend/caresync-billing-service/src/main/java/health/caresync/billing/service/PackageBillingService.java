package health.caresync.billing.service;

import health.caresync.billing.config.PackageBillingConfig;
import health.caresync.billing.domain.entity.PackageBilling;
import health.caresync.billing.domain.enums.DiscountType;
import health.caresync.billing.domain.repository.PackageBillingRepository;
import health.caresync.billing.dto.PackageBillingRequest;
import health.caresync.billing.dto.PackageBillingResponse;
import health.caresync.billing.mapper.PackageBillingMapper;
import health.caresync.common.exception.NotFoundException;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.security.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * Package billing lifecycle.
 *
 * OWASP:
 * - Tenant derived from context (A01).
 * - Money math uses BigDecimal + scale enforcement (A04).
 * - All business invariants checked before persisting (A08).
 */
@Service
public class PackageBillingService {

    private static final Logger log = LoggerFactory.getLogger(PackageBillingService.class);

    private final PackageBillingRepository repository;
    private final PackageBillingMapper mapper;
    private final PackageBillingConfig config;

    public PackageBillingService(PackageBillingRepository repository,
                                 PackageBillingMapper mapper,
                                 PackageBillingConfig config) {
        this.repository = repository;
        this.mapper = mapper;
        this.config = config;
    }

    @Transactional(readOnly = true)
    public List<PackageBillingResponse> listForTenant() {
        return repository.findAllByTenantIdOrderByCreatedAtDesc(requireTenant())
                .stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PackageBillingResponse get(String id) {
        return mapper.toResponse(loadForTenant(id));
    }

    @Transactional
    public PackageBillingResponse create(PackageBillingRequest req) {
        String tenantId = requireTenant();
        validate(req);

        BigDecimal net = computeNet(req.grossPrice(), req.discountAmount(), req.discountType());

        PackageBilling entity = new PackageBilling(
                tenantId,
                req.patientId(),
                req.packageCode(),
                req.grossPrice().setScale(2, RoundingMode.HALF_EVEN),
                req.discountAmount().setScale(2, RoundingMode.HALF_EVEN),
                req.discountType(),
                net,
                req.paymentRoute(),
                req.totalSessions()
        );

        PackageBilling saved = repository.save(entity);
        log.info("PackageBilling created id={} tenant={} patient={} net={}",
                saved.getId(), tenantId, saved.getPatientId(), saved.getNetPrice());
        return mapper.toResponse(saved);
    }

    @Transactional
    public PackageBillingResponse redeem(String id) {
        PackageBilling entity = loadForTenant(id);
        try {
            entity.redeemSession();
        } catch (IllegalStateException e) {
            throw new ValidationException(e.getMessage());
        }
        PackageBilling saved = repository.save(entity);
        log.info("PackageBilling redeemed id={} tenant={} used={}/{}",
                saved.getId(), saved.getTenantId(), saved.getUsedSessions(), saved.getTotalSessions());
        return mapper.toResponse(saved);
    }

    private void validate(PackageBillingRequest req) {
        if (req.grossPrice().compareTo(config.getMaxPackagePrice()) > 0) {
            throw new ValidationException("grossPrice exceeds configured maximum");
        }
        if (req.discountAmount().compareTo(req.grossPrice()) > 0) {
            throw new ValidationException("discountAmount cannot exceed grossPrice");
        }
        BigDecimal net = computeNet(req.grossPrice(), req.discountAmount(), req.discountType());
        if (net.signum() < 0) {
            throw new ValidationException("netPrice cannot be negative");
        }
    }

    private BigDecimal computeNet(BigDecimal gross, BigDecimal discount, DiscountType type) {
        if (type == DiscountType.NONE) {
            return gross.setScale(2, RoundingMode.HALF_EVEN);
        }
        BigDecimal net = gross.subtract(discount).setScale(2, RoundingMode.HALF_EVEN);
        BigDecimal maxDiscount = gross.multiply(config.getMaxDiscountFraction())
                .setScale(2, RoundingMode.HALF_EVEN);
        if (discount.compareTo(maxDiscount) > 0) {
            throw new ValidationException("discountAmount exceeds max allowed fraction");
        }
        return net;
    }

    private PackageBilling loadForTenant(String id) {
        String tenantId = requireTenant();
        return repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new NotFoundException("Package billing not found"));
    }

    private String requireTenant() {
        String t = TenantContext.getTenantId();
        if (t == null || t.isBlank()) throw new ValidationException("Tenant context missing");
        return t;
    }
}