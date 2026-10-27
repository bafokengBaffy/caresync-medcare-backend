package health.caresync.patient;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import health.caresync.common.exception.ConflictException;
import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.patient.domain.entity.Consent;
import health.caresync.patient.domain.repository.ConsentRepository;
import health.caresync.patient.domain.repository.PatientConsentHistoryRepository;
import health.caresync.patient.domain.repository.PatientRepository;
import health.caresync.patient.domain.valueobject.ConsentStatus;
import health.caresync.patient.dto.ConsentCreateRequest;
import health.caresync.patient.mapper.ConsentMapper;
import health.caresync.patient.service.ConsentService;
import health.caresync.patient.validator.ConsentValidator;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

class ConsentServiceTest {
    private final UUID tenantId = UUID.randomUUID();
    private final UUID patientId = UUID.randomUUID();
    private final ConsentRepository consentRepository = org.mockito.Mockito.mock(ConsentRepository.class);
    private final PatientConsentHistoryRepository historyRepository =
        org.mockito.Mockito.mock(PatientConsentHistoryRepository.class);
    private final PatientRepository patientRepository = org.mockito.Mockito.mock(PatientRepository.class);
    private final TenantRlsContext tenantRlsContext = org.mockito.Mockito.mock(TenantRlsContext.class);
    private final ApplicationEventPublisher eventPublisher =
        org.mockito.Mockito.mock(ApplicationEventPublisher.class);
    private final Clock clock = Clock.fixed(Instant.parse("2026-01-02T03:04:05Z"), ZoneOffset.UTC);
    private final ConsentService service = new ConsentService(
        consentRepository,
        historyRepository,
        patientRepository,
        tenantRlsContext,
        new ConsentMapper(),
        new ConsentValidator(),
        eventPublisher,
        clock
    );

    @BeforeEach
    void setUp() {
        when(tenantRlsContext.apply()).thenReturn(tenantId);
        when(patientRepository.existsByIdAndTenantId(patientId, tenantId)).thenReturn(true);
    }

    @Test
    void createsConsentScopedToAuthenticatedTenantAndAuditsIt() {
        when(consentRepository.findByTenantIdAndIdempotencyKey(tenantId, "request-1"))
            .thenReturn(Optional.empty());
        when(consentRepository.save(any(Consent.class)))
            .thenAnswer(invocation -> {
                Consent consent = invocation.getArgument(0);
                org.springframework.test.util.ReflectionTestUtils.setField(
                    consent, "id", UUID.randomUUID()
                );
                return consent;
            });
        ConsentCreateRequest request = new ConsentCreateRequest(
            "TREATMENT", "Care delivery", Instant.parse("2026-02-01T00:00:00Z")
        );

        var response = service.createConsent(
            tenantId, patientId, request, "user-1", "request-1", "correlation-1"
        );

        assertEquals(patientId, response.patientId());
        assertEquals("TREATMENT", response.consentType());
        assertEquals(ConsentStatus.GRANTED.name(), response.status());
        verify(consentRepository).save(any(Consent.class));
        verify(historyRepository).save(any());
        verify(eventPublisher).publishEvent((Object) any());
    }

    @Test
    void rejectsTenantMismatchBeforeReadingConsentData() {
        UUID otherTenant = UUID.randomUUID();

        assertThrows(
            ForbiddenException.class,
            () -> service.createConsent(
                otherTenant,
                patientId,
                new ConsentCreateRequest("TREATMENT", "Care delivery", null),
                "user-1",
                "request-2",
                "correlation-2"
            )
        );

        verify(consentRepository, never()).findByTenantIdAndIdempotencyKey(any(), any());
        verify(patientRepository, never()).existsByIdAndTenantId(any(), any());
    }

    @Test
    void rejectsReuseOfIdempotencyKeyForDifferentRequest() {
        Consent existing = org.mockito.Mockito.mock(Consent.class);
        when(existing.getRequestFingerprint()).thenReturn("different-fingerprint");
        when(consentRepository.findByTenantIdAndIdempotencyKey(tenantId, "request-3"))
            .thenReturn(Optional.of(existing));

        assertThrows(
            ConflictException.class,
            () -> service.createConsent(
                tenantId,
                patientId,
                new ConsentCreateRequest("TREATMENT", "Care delivery", null),
                "user-1",
                "request-3",
                "correlation-3"
            )
        );

        verify(consentRepository, never()).save(any());
    }
}