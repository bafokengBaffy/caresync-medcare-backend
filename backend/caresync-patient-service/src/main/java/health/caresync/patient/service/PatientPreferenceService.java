package health.caresync.patient.service;

import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.exception.NotFoundException;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.patient.domain.entity.PatientPreference;
import health.caresync.patient.domain.repository.PatientPreferenceRepository;
import health.caresync.patient.dto.PatientPreferenceRequest;
import health.caresync.patient.dto.PatientPreferenceResponse;
import health.caresync.patient.event.PatientPreferenceUpdatedEvent;
import health.caresync.patient.mapper.PatientPreferenceMapper;
import java.time.DateTimeException;
import java.time.ZoneId;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PatientPreferenceService {
    private static final Set<String> CONTACT_METHODS = Set.of("EMAIL", "SMS", "PHONE", "POST");

    private final PatientPreferenceRepository preferenceRepository;
    private final PatientService patientService;
    private final PatientPreferenceMapper preferenceMapper;
    private final TenantRlsContext tenantRlsContext;
    private final ApplicationEventPublisher eventPublisher;

    public PatientPreferenceService(
        PatientPreferenceRepository preferenceRepository,
        PatientService patientService,
        PatientPreferenceMapper preferenceMapper,
        TenantRlsContext tenantRlsContext,
        ApplicationEventPublisher eventPublisher
    ) {
        this.preferenceRepository = preferenceRepository;
        this.patientService = patientService;
        this.preferenceMapper = preferenceMapper;
        this.tenantRlsContext = tenantRlsContext;
        this.eventPublisher = eventPublisher;
    }

    @Transactional(readOnly = true)
    public PatientPreferenceResponse get(UUID tenantId, UUID patientId) {
        requireTenant(tenantId);
        patientService.get(patientId);
        PatientPreference preference = preferenceRepository.findByTenantIdAndPatientId(tenantId, patientId)
            .orElseThrow(() -> new NotFoundException("Patient preferences not found"));
        return preferenceMapper.toResponse(preference);
    }

    @Transactional
    public PatientPreferenceResponse update(
        UUID tenantId,
        UUID patientId,
        PatientPreferenceRequest request,
        String actorId
    ) {
        requireTenant(tenantId);
        patientService.get(patientId);
        validate(request);

        PatientPreference preference = preferenceRepository.findByTenantIdAndPatientId(tenantId, patientId)
            .orElseGet(() -> new PatientPreference(tenantId, patientId, actorId));
        preference.update(
            request.preferredContactMethod(),
            request.preferredLanguage(),
            request.timeZone(),
            request.accessibilityNeeds(),
            request.emailRemindersEnabled(),
            request.smsRemindersEnabled(),
            request.phoneRemindersEnabled(),
            actorId
        );
        PatientPreference saved = preferenceRepository.save(preference);
        eventPublisher.publishEvent(new PatientPreferenceUpdatedEvent(tenantId, patientId, actorId));
        return preferenceMapper.toResponse(saved);
    }

    private void requireTenant(UUID tenantId) {
        if (!Objects.equals(tenantId, tenantRlsContext.apply())) {
            throw new ForbiddenException("Tenant access denied");
        }
    }

    private void validate(PatientPreferenceRequest request) {
        if (request == null
            || request.preferredContactMethod() == null
            || !CONTACT_METHODS.contains(request.preferredContactMethod())
            || request.preferredLanguage() == null
            || request.preferredLanguage().isBlank()
            || request.timeZone() == null
            || request.timeZone().isBlank()
            || (request.accessibilityNeeds() != null && request.accessibilityNeeds().length() > 2000)
            || request.emailRemindersEnabled() == null
            || request.smsRemindersEnabled() == null
            || request.phoneRemindersEnabled() == null) {
            throw new ValidationException("Patient preferences are invalid");
        }
        try {
            ZoneId.of(request.timeZone());
        } catch (DateTimeException exception) {
            throw new ValidationException("Time zone is invalid");
        }
    }
}