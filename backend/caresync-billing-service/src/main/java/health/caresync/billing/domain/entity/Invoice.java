package health.caresync.billing.domain.entity;
import health.caresync.common.annotation.TenantAware;
import health.caresync.common.tenant.TenantAwareEntityListener;
import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.math.BigDecimal; import java.time.Instant; import java.util.UUID;
@Entity
@Table(name = "invoices", indexes = @Index(name = "idx_invoice_tenant", columnList = "tenant_id"))
@EntityListeners({AuditingEntityListener.class, TenantAwareEntityListener.class})
@TenantAware
public class Invoice implements health.caresync.common.tenant.TenantAware {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "tenant_id", nullable = false, updatable = false) private UUID tenantId;
    @Column(nullable = false) private String patientId;
    @Column(nullable = false) private BigDecimal totalAmount;
    @Column(nullable = false) private String status; // DRAFT, ISSUED, PAID, CANCELLED
    @CreatedDate @Column(nullable = false, updatable = false) private Instant createdAt;
    public UUID getId() { return id; } public void setId(UUID id) { this.id = id; }
    @Override public UUID getTenantId() { return tenantId; } @Override public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }
    public String getPatientId() { return patientId; } public void setPatientId(String patientId) { this.patientId = patientId; }
    public BigDecimal getTotalAmount() { return totalAmount; } public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; } public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
