package health.caresync.patient.domain.entity;

import health.caresync.common.tenant.TenantAware;
import health.caresync.common.tenant.TenantAwareEntityListener;
import health.caresync.patient.domain.valueobject.RelationshipType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "patient_guardians")
@EntityListeners(TenantAwareEntityListener.class)
public class Guardian implements TenantAware {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "patient_id", nullable = false, updatable = false)
    private UUID patientId;

    @Column(name = "guardian_user_id", nullable = false, length = 128)
    private String guardianUserId;

    @Column(name = "full_name", nullable = false, length = 128)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(name = "relationship_type", nullable = false, length = 32)
    private RelationshipType relationshipType;

    @Column(length = 254)
    private String email;

    @Column(length = 32)
    private String phone;

    @Column(name = "primary_contact", nullable = false)
    private boolean primaryContact;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Version
    private long version;

    protected Guardian() { }

    public Guardian(
        UUID tenantId,
        UUID patientId,
        String guardianUserId,
        String fullName,
        RelationshipType relationshipType,
        String email,
        String phone,
        boolean primaryContact
    ) {
        this.tenantId = tenantId;
        this.patientId = patientId;
        this.guardianUserId = guardianUserId;
        this.fullName = fullName;
        this.relationshipType = relationshipType;
        this.email = email;
        this.phone = phone;
        this.primaryContact = primaryContact;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    @Override
    public UUID getTenantId() { return tenantId; }

    @Override
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }

    public UUID getId() { return id; }
    public UUID getPatientId() { return patientId; }
    public String getGuardianUserId() { return guardianUserId; }
    public String getFullName() { return fullName; }
    public RelationshipType getRelationshipType() { return relationshipType; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public boolean isPrimaryContact() { return primaryContact; }
    public Instant getCreatedAt() { return createdAt; }
    public long getVersion() { return version; }
}
