package health.caresync.patient.domain.entity;

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
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "patient_preferences",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_patient_preferences_tenant_patient",
        columnNames = {"tenant_id", "patient_id"}
    )
)
@EntityListeners(TenantAwareEntityListener.class)
public class PatientPreference implements TenantAware {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "patient_id", nullable = false, updatable = false)
    private UUID patientId;

    @Column(name = "preferred_contact_method", nullable = false, length = 16)
    private String preferredContactMethod;

    @Column(name = "preferred_language", nullable = false, length = 35)
    private String preferredLanguage;

    @Column(name = "time_zone", nullable = false, length = 64)
    private String timeZone;

    @Column(name = "accessibility_needs", length = 2000)
    private String accessibilityNeeds;

    @Column(name = "email_reminders_enabled", nullable = false)
    private boolean emailRemindersEnabled;

    @Column(name = "sms_reminders_enabled", nullable = false)
    private boolean smsRemindersEnabled;

    @Column(name = "phone_reminders_enabled", nullable = false)
    private boolean phoneRemindersEnabled;

    @Column(name = "created_by", nullable = false, updatable = false, length = 128)
    private String createdBy;

    @Column(name = "updated_by", nullable = false, length = 128)
    private String updatedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    private long version;

    protected PatientPreference() { }

    public PatientPreference(UUID tenantId, UUID patientId, String actorId) {
        this.tenantId = tenantId;
        this.patientId = patientId;
        this.createdBy = actorId;
        this.updatedBy = actorId;
        this.emailRemindersEnabled = false;
        this.smsRemindersEnabled = false;
        this.phoneRemindersEnabled = false;
    }

    @Override
    public UUID getTenantId() {
        return tenantId;
    }

    @Override
    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    public UUID getId() { return id; }
    public UUID getPatientId() { return patientId; }
    public String getPreferredContactMethod() { return preferredContactMethod; }
    public String getPreferredLanguage() { return preferredLanguage; }
    public String getTimeZone() { return timeZone; }
    public String getAccessibilityNeeds() { return accessibilityNeeds; }
    public boolean isEmailRemindersEnabled() { return emailRemindersEnabled; }
    public boolean isSmsRemindersEnabled() { return smsRemindersEnabled; }
    public boolean isPhoneRemindersEnabled() { return phoneRemindersEnabled; }
    public String getCreatedBy() { return createdBy; }
    public String getUpdatedBy() { return updatedBy; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public long getVersion() { return version; }

    @PrePersist
    private void initializeTimestamps() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    private void updateTimestamp() {
        updatedAt = Instant.now();
    }

    public void update(
        String preferredContactMethod,
        String preferredLanguage,
        String timeZone,
        String accessibilityNeeds,
        boolean emailRemindersEnabled,
        boolean smsRemindersEnabled,
        boolean phoneRemindersEnabled,
        String updatedBy
    ) {
        this.preferredContactMethod = preferredContactMethod;
        this.preferredLanguage = preferredLanguage;
        this.timeZone = timeZone;
        this.accessibilityNeeds = accessibilityNeeds;
        this.emailRemindersEnabled = emailRemindersEnabled;
        this.smsRemindersEnabled = smsRemindersEnabled;
        this.phoneRemindersEnabled = phoneRemindersEnabled;
        this.updatedBy = updatedBy;
    }
}
