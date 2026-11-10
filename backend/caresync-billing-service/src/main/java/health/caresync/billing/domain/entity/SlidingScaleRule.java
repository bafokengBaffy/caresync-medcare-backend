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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "sliding_scale_rules")
@EntityListeners(TenantAwareEntityListener.class)
public class SlidingScaleRule implements TenantAware {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "minimum_annual_income_cents", nullable = false)
    private long minimumAnnualIncomeCents;

    @Column(name = "maximum_annual_income_cents")
    private Long maximumAnnualIncomeCents;

    @Column(name = "discount_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal discountPercentage;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    @Override
    public UUID getTenantId() { return tenantId; }

    @Override
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public long getMinimumAnnualIncomeCents() { return minimumAnnualIncomeCents; }
    public void setMinimumAnnualIncomeCents(long minimumAnnualIncomeCents) {
        this.minimumAnnualIncomeCents = minimumAnnualIncomeCents;
    }
    public Long getMaximumAnnualIncomeCents() { return maximumAnnualIncomeCents; }
    public void setMaximumAnnualIncomeCents(Long maximumAnnualIncomeCents) {
        this.maximumAnnualIncomeCents = maximumAnnualIncomeCents;
    }
    public BigDecimal getDiscountPercentage() { return discountPercentage; }
    public void setDiscountPercentage(BigDecimal discountPercentage) {
        this.discountPercentage = discountPercentage;
    }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}