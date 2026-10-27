package health.caresync.patient;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.patient.domain.entity.AuditLog;
import health.caresync.patient.domain.repository.AuditLogRepository;
import health.caresync.patient.service.AuditService;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AuditServiceTest {
    @Mock
    private AuditLogRepository repository;

    @Mock
    private TenantRlsContext tenantRlsContext;

    @Test
    void recordsAuditEventOnlyForActiveTenant() {
        UUID tenantId = UUID.randomUUID();
        when(tenantRlsContext.apply()).thenReturn(tenantId);
        when(repository.save(any(AuditLog.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        AuditLog saved = new AuditService(repository, tenantRlsContext).record(
            tenantId, "actor-1", "STAFF", "PATIENT_UPDATED", "PATIENT", "patient-1", "request-1"
        );

        assertEquals(tenantId, saved.getTenantId());
        assertEquals("actor-1", saved.getActorUserId());
        assertEquals("PATIENT_UPDATED", saved.getAction());
        assertEquals("request-1", saved.getRequestId());
        verify(repository).save(any(AuditLog.class));
    }

    @Test
    void rejectsAuditEventForDifferentTenant() {
        when(tenantRlsContext.apply()).thenReturn(UUID.randomUUID());

        assertThrows(
            ForbiddenException.class,
            () -> new AuditService(repository, tenantRlsContext).record(
                UUID.randomUUID(), "actor-1", "STAFF", "PATIENT_UPDATED", "PATIENT", "patient-1", null
            )
        );
    }
}
