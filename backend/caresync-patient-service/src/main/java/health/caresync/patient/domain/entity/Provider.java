package health.caresync.patient.domain.entity;

import health.caresync.common.annotation.TenantAware;
import health.caresync.common.tenant.TenantAwareEntityListener;
import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

/**
 * Entity representing a Healthcare Provider (Doctor, Nurse, Dentist, etc.).
 * OWASP Alignment: Implements TenantAware to isolate provider data.
 * Includes specialty checks to prevent unauthorized clinical access (BOLA).
 */
@Entity
@Table(name = "providers", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "user_id"}),
       indexes = @Index(name = "idx_providers_tenant", columnList = "tenant_id"))
@EntityListeners({AuditingEntityListener.class, TenantAwareEntityListener.class})
@TenantAware
public class Provider implements health.caresync.common.tenant.TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "user_id", nullable = false)
    private String userId; // Firebase Auth UID

    @Column(nullable = false, length = 100)
    private String firstName;

    @Column(nullable = false, length = 100)
    private String lastName;

    @Column(nullable = false, length = 50)
    private String specialty; // e.g., DENTAL, MENTAL_HEALTH, OPTIMETRY, NURSING, WELLNESS, COMMUNITY

    @Column(length = 100)
    private String licenseNumber;

    @Column(nullable = false)
    private boolean isActive = true;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private Instant updatedAt;

    // TenantAware Implementation
    @Override
    public UUID getTenantId() { return tenantId; }
    @Override
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getSpecialty() { return specialty; }
    public void setSpecialty(String specialty) { this.specialty = specialty; }
    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
