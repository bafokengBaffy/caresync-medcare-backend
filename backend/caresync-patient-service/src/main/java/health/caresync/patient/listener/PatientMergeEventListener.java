package health.caresync.patient.listener;

import health.caresync.patient.event.PatientMergedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class PatientMergeEventListener {
    private static final Logger LOGGER = LoggerFactory.getLogger(PatientMergeEventListener.class);

    @EventListener
    public void onPatientMerged(PatientMergedEvent event) {
        LOGGER.info(
            "Patient merge event emitted tenantId={} mergeId={} action={}",
            event.tenantId(), event.mergeId(), event.action()
        );
    }
}