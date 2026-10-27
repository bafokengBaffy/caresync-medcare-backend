package health.caresync.patient;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.patient.domain.entity.AuditLog;
import health.caresync.patient.domain.repository.AuditLogRepository;
import health.caresync.patient.service.AuditLogService;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
class AuditLogServiceTest {
    @Mock
    private AuditLogRepository repository;

    @Mock
    private TenantRlsContext tenantContext;

    @Test
    void listsAuditRowsForAuthenticatedTenant() {
        UUID tenantId = UUID.randomUUID();
        AuditLog log = org.mockito.Mockito.mock(AuditLog.class);
        when(tenantContext.apply()).thenReturn(tenantId);
        when(log.getId()).thenReturn(17L);
        when(log.getTenantId()).thenReturn(tenantId);
        when(log.getAction()).thenReturn("READ");
        when(log.getResourceType()).thenReturn("PATIENT");
        when(log.getResourceId()).thenReturn("patient-123");
        when(log.getCreatedAt()).thenReturn(Instant.parse("2026-10-27T08:00:00Z"));
        when(repository.findAllByTenantId(eq(tenantId), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(log), PageRequest.of(0, 20), 1));

        var result = new AuditLogService(repository, tenantContext).list(tenantId, 0, 20);

        assertEquals(1, result.total());
        assertEquals("17", result.content().get(0).id());
        assertEquals("READ", result.content().get(0).action());
        verify(repository).findAllByTenantId(eq(tenantId), any(Pageable.class));
    }

    @Test
    void rejectsTenantMismatchBeforeQueryingRepository() {
        UUID tenantId = UUID.randomUUID();
        when(tenantContext.apply()).thenReturn(UUID.randomUUID());

        assertThrows(
            ForbiddenException.class,
            () -> new AuditLogService(repository, tenantContext).list(tenantId, 0, 20)
        );
        verifyNoInteractions(repository);
    }
}
