package health.caresync.patient.listener;

import health.caresync.patient.event.ConsentGrantedEvent;
import health.caresync.patient.event.ConsentRevokedEvent;
import health.caresync.patient.event.PatientMergedEvent;
import health.caresync.patient.event.PatientPreferenceUpdatedEvent;
import health.caresync.patient.service.AuditService;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class AuditEventListener {
    private final AuditService auditService;

    public AuditEventListener(AuditService auditService) {
        this.auditService = auditService;
    }

    @EventListener
    public void onConsentGranted(ConsentGrantedEvent event) {
        auditService.record(
            event.tenantId(), event.actorUserId(), null, "CONSENT_GRANTED", "CONSENT",
            event.consentId().toString(), null
        );
    }

    @EventListener
    public void onConsentRevoked(ConsentRevokedEvent event) {
        auditService.record(
            event.tenantId(), event.actorUserId(), null, "CONSENT_REVOKED", "CONSENT",
            event.consentId().toString(), null
        );
    }

    @EventListener
    public void onPatientMerged(PatientMergedEvent event) {
        auditService.record(
            event.tenantId(), event.actorUserId(), null, event.action(), "PATIENT_MERGE",
            event.mergeId().toString(), null
        );
    }

    @EventListener
    public void onPreferencesUpdated(PatientPreferenceUpdatedEvent event) {
        auditService.record(
            event.tenantId(), event.actorUserId(), null, "PATIENT_PREFERENCES_UPDATED", "PATIENT",
            event.patientId().toString(), null
        );
    }
}