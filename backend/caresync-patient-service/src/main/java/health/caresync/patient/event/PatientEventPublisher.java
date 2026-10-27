package health.caresync.patient.event;

import java.util.Objects;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

@Component
public class PatientEventPublisher {
    private final ApplicationEventPublisher publisher;

    public PatientEventPublisher(ApplicationEventPublisher publisher) {
        this.publisher = publisher;
    }

    public void patientCreated(UUID patientId, UUID tenantId) {
        publisher.publishEvent(new PatientCreatedEvent(
            Objects.requireNonNull(patientId), Objects.requireNonNull(tenantId)
        ));
    }

    public void patientUpdated(UUID patientId, UUID tenantId) {
        publisher.publishEvent(new PatientUpdatedEvent(
            Objects.requireNonNull(patientId), Objects.requireNonNull(tenantId)
        ));
    }
}