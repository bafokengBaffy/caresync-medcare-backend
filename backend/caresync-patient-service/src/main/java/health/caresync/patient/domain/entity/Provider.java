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
    @Column private String email;
    @Column(name = "phone_number") private String phoneNumber;
    @Column private String npi;
    @Column(name = "years_of_experience") private Integer yearsOfExperience;
    @Column(columnDefinition = "text") private String bio;
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
    public String getEmail() { return email; }
    public String getPhoneNumber() { return phoneNumber; }
    public String getNpi() { return npi; }
    public Integer getYearsOfExperience() { return yearsOfExperience; }
    public String getBio() { return bio; }
    public Instant getCreatedAt() { return createdAt; }
    public boolean isActive() { return active; }
    public void setUserId(String userId) { this.userId = userId; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public void setSpecialty(String specialty) { this.specialty = specialty; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }
    public void setEmail(String email) { this.email = email; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public void setNpi(String npi) { this.npi = npi; }
    public void setYearsOfExperience(Integer yearsOfExperience) { this.yearsOfExperience = yearsOfExperience; }
    public void setBio(String bio) { this.bio = bio; }
    public void setActive(boolean active) { this.active = active; }
}