package health.caresync.billing.domain.entity;

import health.caresync.billing.domain.enums.DiscountType;
import health.caresync.billing.domain.enums.PaymentRoute;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Package billing aggregate.
 *
 * OWASP notes:
 * - `tenantId` immutable -> cannot be shifted by malicious update.
 * - `packageCode` restricted to a safe charset to avoid injection via lookups (A03).
 * - All money bounds validated.
 */
@Entity
@Table(
        name = "package_billing",
        indexes = {
                @Index(name = "idx_pkg_billing_tenant_patient", columnList = "tenant_id, patient_id"),
                @Index(name = "idx_pkg_billing_status", columnList = "status")
        }
)
public class PackageBilling {

    @Id
    @Column(name = "id", nullable = false, updatable = false, length = 36)
    private String id = UUID.randomUUID().toString();

    @NotBlank
    @Column(name = "tenant_id", nullable = false, updatable = false, length = 64)
    private String tenantId;

    @NotBlank
    @Column(name = "patient_id", nullable = false, updatable = false, length = 64)
    private String patientId;

    @NotBlank
    @Pattern(regexp = "^[A-Z0-9_\\-]{1,64}$", message = "invalid package code")
    @Column(name = "package_code", nullable = false, length = 64)
    private String packageCode;

    @NotNull
    @DecimalMin("0.01")
    @Column(name = "gross_price", nullable = false, precision = 19, scale = 2)
    private BigDecimal grossPrice;

    @NotNull
    @DecimalMin("0.00")
    @Column(name = "discount_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 16)
    private DiscountType discountType = DiscountType.NONE;

    @NotNull
    @DecimalMin("0.00")
    @Column(name = "net_price", nullable = false, precision = 19, scale = 2)
    private BigDecimal netPrice;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_route", nullable = false, length = 16)
    private PaymentRoute paymentRoute = PaymentRoute.PRIVATE;

    @Min(1)
    @Max(1000)
    @Column(name = "total_sessions", nullable = false)
    private int totalSessions;

    @Min(0)
    @Column(name = "used_sessions", nullable = false)
    private int usedSessions = 0;

    @NotBlank
    @Pattern(regexp = "^(ACTIVE|EXHAUSTED|REFUNDED|CANCELLED)$")
    @Column(name = "status", nullable = false, length = 16)
    private String status = "ACTIVE";

    @NotNull
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @NotNull
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected PackageBilling() {}

    public PackageBilling(String tenantId, String patientId, String packageCode,
                          BigDecimal grossPrice, BigDecimal discountAmount, DiscountType discountType,
                          BigDecimal netPrice, PaymentRoute paymentRoute, int totalSessions) {
        this.tenantId = tenantId;
        this.patientId = patientId;
        this.packageCode = packageCode;
        this.grossPrice = grossPrice;
        this.discountAmount = discountAmount;
        this.discountType = discountType;
        this.netPrice = netPrice;
        this.paymentRoute = paymentRoute;
        this.totalSessions = totalSessions;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public void redeemSession() {
        if (!"ACTIVE".equals(status)) {
            throw new IllegalStateException("Package is not active");
        }
        if (usedSessions >= totalSessions) {
            throw new IllegalStateException("Package sessions exhausted");
        }
        usedSessions++;
        if (usedSessions == totalSessions) {
            status = "EXHAUSTED";
        }
    }

    // getters
    public String getId() { return id; }
    public String getTenantId() { return tenantId; }
    public String getPatientId() { return patientId; }
    public String getPackageCode() { return packageCode; }
    public BigDecimal getGrossPrice() { return grossPrice; }
    public BigDecimal getDiscountAmount() { return discountAmount; }
    public DiscountType getDiscountType() { return discountType; }
    public BigDecimal getNetPrice() { return netPrice; }
    public PaymentRoute getPaymentRoute() { return paymentRoute; }
    public int getTotalSessions() { return totalSessions; }
    public int getUsedSessions() { return usedSessions; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}