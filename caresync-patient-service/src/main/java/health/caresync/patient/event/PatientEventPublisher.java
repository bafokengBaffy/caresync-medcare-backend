package health.caresync.patient.event;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
@Component public class PatientEventPublisher { private final ApplicationEventPublisher p; public PatientEventPublisher(ApplicationEventPublisher p){this.p=p;} }