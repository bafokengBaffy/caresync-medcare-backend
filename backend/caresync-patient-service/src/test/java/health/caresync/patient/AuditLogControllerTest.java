package health.caresync.patient;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.security.TenantContext;
import health.caresync.common.web.PageResponse;
import health.caresync.patient.controller.AuditLogController;
import health.caresync.patient.service.AuditLogService;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import jakarta.servlet.http.HttpServletRequest;

class AuditLogControllerTest {
    private final AuditLogService auditLogService = mock(AuditLogService.class);
    private final HttpServletRequest request = mock(HttpServletRequest.class);
    private final AuditLogController controller = new AuditLogController(auditLogService);

    @AfterEach
    void clearTenantContext() {
        TenantContext.clear();
    }

    @Test
    void allowsPlatformAdminToReadOnlyTheSelectedTenantAuditTrail() {
        UUID selectedTenantId = UUID.randomUUID();
        TenantContext.set(selectedTenantId);
        when(auditLogService.list(selectedTenantId, 0, 20))
            .thenReturn(new PageResponse<>(List.of(), 0, 20, 0));
        CaresyncPrincipal principal = new CaresyncPrincipal("platform-user", null, "SUPER_ADMIN", null, null);

        var response = controller.list(selectedTenantId, 0, 20, principal, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(auditLogService).list(selectedTenantId, 0, 20);
    }

    @Test
    void rejectsPlatformAdminWhenRequestedTenantIsNotSelected() {
        TenantContext.set(UUID.randomUUID());
        CaresyncPrincipal principal = new CaresyncPrincipal("platform-user", null, "SUPER_ADMIN", null, null);

        assertThrows(
            ForbiddenException.class,
            () -> controller.list(UUID.randomUUID(), 0, 20, principal, request)
        );
        verifyNoInteractions(auditLogService);
    }
}
