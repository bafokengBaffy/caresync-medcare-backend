package health.caresync.patient;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.patient.domain.entity.Patient;
import health.caresync.patient.domain.entity.PatientMergeLog;
import health.caresync.patient.domain.repository.PatientMergeLogRepository;
import health.caresync.patient.domain.repository.PatientRepository;
import health.caresync.patient.domain.valueobject.MergeStatus;
import health.caresync.patient.event.PatientMergedEvent;
import health.caresync.patient.service.PatientMergeService;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;

class PatientMergeServiceTest {
    private final UUID tenantId = UUID.randomUUID();
    private final UUID sourceId = UUID.randomUUID();
    private final UUID targetId = UUID.randomUUID();
    private final UUID mergeId = UUID.randomUUID();
    private final PatientRepository patientRepository = org.mockito.Mockito.mock(PatientRepository.class);
    private final PatientMergeLogRepository mergeRepository =
        org.mockito.Mockito.mock(PatientMergeLogRepository.class);
    private final TenantRlsContext tenantRlsContext = org.mockito.Mockito.mock(TenantRlsContext.class);
    private final ApplicationEventPublisher eventPublisher =
        org.mockito.Mockito.mock(ApplicationEventPublisher.class);
    private final Clock clock = Clock.fixed(Instant.parse("2026-01-02T03:04:05Z"), ZoneOffset.UTC);
    private final PatientMergeService service = new PatientMergeService(
        patientRepository, mergeRepository, tenantRlsContext, eventPublisher, clock
    );

    @BeforeEach
    void setUp() {
        when(tenantRlsContext.apply()).thenReturn(tenantId);
    }

    @Test
    void requiresFourEyesBeforeLookingUpPatients() {
        PatientMergeLog merge = pendingMerge("requester");
        when(mergeRepository.findByIdAndTenantId(mergeId, tenantId)).thenReturn(Optional.of(merge));

        assertThrows(
            ForbiddenException.class,
            () -> service.confirmMerge(tenantId, mergeId, null, "requester")
        );

        verify(patientRepository, never()).findByIdAndTenantIdAndMergedIntoPatientIdIsNull(any(), any());
    }

    @Test
    void confirmationSoftMergesSourceAndPublishesDomainEvent() {
        PatientMergeLog merge = pendingMerge("requester");
        Patient source = org.mockito.Mockito.mock(Patient.class);
        Patient target = org.mockito.Mockito.mock(Patient.class);
        when(mergeRepository.findByIdAndTenantId(mergeId, tenantId)).thenReturn(Optional.of(merge));
        when(patientRepository.findByIdAndTenantIdAndMergedIntoPatientIdIsNull(sourceId, tenantId))
            .thenReturn(Optional.of(source));
        when(patientRepository.findByIdAndTenantIdAndMergedIntoPatientIdIsNull(targetId, tenantId))
            .thenReturn(Optional.of(target));
        when(mergeRepository.save(any(PatientMergeLog.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(patientRepository.save(source)).thenReturn(source);

        var response = service.confirmMerge(tenantId, mergeId, "reviewed", "reviewer");

        assertEquals(MergeStatus.CONFIRMED.name(), response.status());
        verify(source).setMergedIntoPatientId(targetId);
        verify(source).setMergedAt(clock.instant());
        verify(patientRepository).save(source);
        verify(eventPublisher).publishEvent((Object) any());
    }

    private PatientMergeLog pendingMerge(String requesterId) {
        PatientMergeLog merge = new PatientMergeLog();
        ReflectionTestUtils.setField(merge, "id", mergeId);
        merge.setTenantId(tenantId);
        merge.setSourcePatientId(sourceId);
        merge.setTargetPatientId(targetId);
        merge.setRequesterUserId(requesterId);
        merge.setRequestReason("Duplicate record");
        merge.setStatus(MergeStatus.PENDING);
        return merge;
    }
}