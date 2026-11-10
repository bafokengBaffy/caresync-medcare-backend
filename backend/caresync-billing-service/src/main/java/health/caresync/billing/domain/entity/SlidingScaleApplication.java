package health.caresync.billing.domain.entity;

import health.caresync.common.tenant.TenantAware;
import health.caresync.common.tenant.TenantAwareEntityListener;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "sliding_scale_applications")
@EntityListeners(TenantAwareEntityListener.class)
public class SlidingScaleApplication implements TenantAware {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "invoice_id", nullable = false)
    private UUID invoiceId;

    @Column(name = "rule_id", nullable = false)
    private UUID ruleId;

    @Column(name = "original_amount_cents", nullable = false)
    private long originalAmountCents;

    @Column(name = "discount_amount_cents", nullable = false)
    private long discountAmountCents;

    @Column(name = "resulting_amount_cents", nullable = false)
    private long resultingAmountCents;

    @Column(name = "applied_at", nullable = false)
    private Instant appliedAt;

    @PrePersist
    void onCreate() {
        appliedAt = appliedAt == null ? Instant.now() : appliedAt;
    }

    @Override
    public UUID getTenantId() { return tenantId; }

    @Override
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }

    public UUID getId() { return id; }
    public UUID getInvoiceId() { return invoiceId; }
    public void setInvoiceId(UUID invoiceId) { this.invoiceId = invoiceId; }
    public UUID getRuleId() { return ruleId; }
    public void setRuleId(UUID ruleId) { this.ruleId = ruleId; }
    public long getOriginalAmountCents() { return originalAmountCents; }
    public void setOriginalAmountCents(long originalAmountCents) { this.originalAmountCents = originalAmountCents; }
    public long getDiscountAmountCents() { return discountAmountCents; }
    public void setDiscountAmountCents(long discountAmountCents) { this.discountAmountCents = discountAmountCents; }
    public long getResultingAmountCents() { return resultingAmountCents; }
    public void setResultingAmountCents(long resultingAmountCents) { this.resultingAmountCents = resultingAmountCents; }
    public Instant getAppliedAt() { return appliedAt; }
}
