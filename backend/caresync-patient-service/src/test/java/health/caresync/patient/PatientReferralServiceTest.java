package health.caresync.patient;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import health.caresync.common.exception.ValidationException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.patient.domain.entity.Patient;
import health.caresync.patient.domain.entity.PatientReferral;
import health.caresync.patient.domain.repository.PatientReferralRepository;
import health.caresync.patient.domain.repository.PatientRepository;
import health.caresync.patient.dto.PatientReferralStatusRequest;
import health.caresync.patient.service.AuditService;
import health.caresync.patient.service.PatientReferralService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PatientReferralServiceTest {
    @Mock
    private PatientReferralRepository referralRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private TenantRlsContext tenantRlsContext;

    @Mock
    private AuditService auditService;

    @Test
    void refusesToSkipReferralWorkflowStates() {
        UUID tenantId = UUID.randomUUID();
        UUID patientId = UUID.randomUUID();
        UUID referralId = UUID.randomUUID();
        Patient patient = org.mockito.Mockito.mock(Patient.class);
        PatientReferral referral = org.mockito.Mockito.mock(PatientReferral.class);
        when(tenantRlsContext.apply()).thenReturn(tenantId);
        when(patientRepository.findByIdAndTenantIdAndMergedIntoPatientIdIsNull(patientId, tenantId))
            .thenReturn(Optional.of(patient));
        when(patient.getTenantId()).thenReturn(tenantId);
        when(referralRepository.findByIdAndTenantIdAndPatientId(referralId, tenantId, patientId))
            .thenReturn(Optional.of(referral));
        when(referral.getStatus()).thenReturn("PENDING");
        CaresyncPrincipal actor = new CaresyncPrincipal("staff-user", tenantId, "STAFF", null, null);

        assertThrows(
            ValidationException.class,
            () -> new PatientReferralService(referralRepository, patientRepository, tenantRlsContext, auditService)
                .updateStatus(
                    patientId,
                    referralId,
                    new PatientReferralStatusRequest("COMPLETED", null),
                    actor,
                    org.mockito.Mockito.mock(HttpServletRequest.class)
                )
        );

        verify(referralRepository, never()).save(any(PatientReferral.class));
    }
}
