package health.caresync.patient;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.patient.domain.entity.PatientPreference;
import health.caresync.patient.domain.repository.PatientPreferenceRepository;
import health.caresync.patient.dto.PatientPreferenceRequest;
import health.caresync.patient.event.PatientPreferenceUpdatedEvent;
import health.caresync.patient.mapper.PatientPreferenceMapper;
import health.caresync.patient.service.PatientPreferenceService;
import health.caresync.patient.service.PatientService;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

@ExtendWith(MockitoExtension.class)
class PatientPreferenceServiceTest {
    @Mock
    private PatientPreferenceRepository repository;

    @Mock
    private PatientService patientService;

    @Mock
    private TenantRlsContext tenantContext;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Test
    void upsertsPreferencesAndPublishesUpdateEvent() {
        UUID tenantId = UUID.randomUUID();
        UUID patientId = UUID.randomUUID();
        when(tenantContext.apply()).thenReturn(tenantId);
        when(repository.findByTenantIdAndPatientId(tenantId, patientId)).thenReturn(Optional.empty());
        when(repository.save(any(PatientPreference.class))).thenAnswer(invocation -> invocation.getArgument(0));
        PatientPreferenceRequest request = new PatientPreferenceRequest(
            "EMAIL", "en-ZA", "Africa/Johannesburg", "Large-print notices", true, false, false
        );

        var result = new PatientPreferenceService(
            repository,
            patientService,
            new PatientPreferenceMapper(),
            tenantContext,
            eventPublisher
        ).update(tenantId, patientId, request, "user-1");

        assertEquals(patientId, result.patientId());
        assertEquals("EMAIL", result.preferredContactMethod());
        assertEquals("Africa/Johannesburg", result.timeZone());
        assertEquals("Large-print notices", result.accessibilityNeeds());
        assertFalse(result.smsRemindersEnabled());
        verify(patientService).get(patientId);
        verify(eventPublisher).publishEvent(new PatientPreferenceUpdatedEvent(tenantId, patientId, "user-1"));
    }

    @Test
    void rejectsTenantMismatchBeforePatientOrPreferenceLookup() {
        UUID tenantId = UUID.randomUUID();
        when(tenantContext.apply()).thenReturn(UUID.randomUUID());

        assertThrows(
            ForbiddenException.class,
            () -> new PatientPreferenceService(
                repository,
                patientService,
                new PatientPreferenceMapper(),
                tenantContext,
                eventPublisher
            ).get(tenantId, UUID.randomUUID())
        );
        verifyNoInteractions(patientService, repository);
    }
}
