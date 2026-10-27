package health.caresync.patient.listener;

import health.caresync.patient.event.ConsentGrantedEvent;
import health.caresync.patient.event.ConsentRevokedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class ConsentEventListener {
    private static final Logger LOGGER = LoggerFactory.getLogger(ConsentEventListener.class);

    @EventListener
    public void onConsentGranted(ConsentGrantedEvent event) {
        LOGGER.info(
            "Consent granted tenantId={} patientId={} consentId={} type={}",
            event.tenantId(), event.patientId(), event.consentId(), event.consentType()
        );
    }

    @EventListener
    public void onConsentRevoked(ConsentRevokedEvent event) {
        LOGGER.info(
            "Consent revoked tenantId={} patientId={} consentId={} type={}",
            event.tenantId(), event.patientId(), event.consentId(), event.consentType()
        );
    }
}