package health.caresync.patient.domain.entity;
import health.caresync.common.tenant.*;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "providers")
@EntityListeners(TenantAwareEntityListener.class)
public class Provider implements TenantAware {
    @Id @GeneratedValue private UUID id;
    @Column(name = "tenant_id", nullable = false) private UUID tenantId;
    @Column(name = "user_id", nullable = false) private String userId;
    @Column(name = "first_name", nullable = false) private String firstName;
    @Column(name = "last_name",  nullable = false) private String lastName;
    @Column(nullable = false) private String specialty;
    @Column(name = "license_number") private String licenseNumber;
    @Column(name = "is_active") private boolean active = true;
    @Column(name = "created_at") private Instant createdAt;
    @Override public UUID getTenantId() { return tenantId; }
    @Override public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }
    public UUID getId() { return id; }
    public String getUserId() { return userId; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getSpecialty() { return specialty; }
    public String getLicenseNumber() { return licenseNumber; }
    public boolean isActive() { return active; }
}