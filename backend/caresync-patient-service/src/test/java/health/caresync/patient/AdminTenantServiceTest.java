package health.caresync.patient;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import health.caresync.common.exception.ConflictException;
import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.patient.controller.AdminTenantController;
import health.caresync.patient.service.AdminTenantService;
import health.caresync.patient.service.AuditService;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;

@ExtendWith(MockitoExtension.class)
class AdminTenantServiceTest {
    @Mock
    private JdbcTemplate jdbc;

    @Mock
    private TenantRlsContext tenantRlsContext;

    @Mock
    private AuditService auditService;

    private AdminTenantService service() {
        return new AdminTenantService(jdbc, tenantRlsContext, auditService);
    }

    @Test
    void tenantAdministratorCannotUsePlatformTenantListing() {
        CaresyncPrincipal actor = new CaresyncPrincipal(
            "tenant-admin", UUID.randomUUID(), "TENANT_ADMIN", null, "admin@example.test"
        );

        assertThrows(ForbiddenException.class, () -> service().list(actor, null, null, null, 0, 20));
        verifyNoInteractions(jdbc, tenantRlsContext);
    }

    @Test
    void tenantDeletionIsRejectedToPreserveClinicalAndAuditData() {
        UUID tenantId = UUID.randomUUID();
        CaresyncPrincipal actor = new CaresyncPrincipal(
            "platform-admin", null, "SUPER_ADMIN", null, "platform@example.test"
        );
        when(jdbc.queryForObject(anyString(), eq(Boolean.class), eq(tenantId))).thenReturn(true);

        assertThrows(ConflictException.class, () -> service().rejectDeletion(actor, tenantId));
        verify(tenantRlsContext).apply(actor, null);
        verify(jdbc, never()).update(anyString(), eq(tenantId));
        verifyNoInteractions(auditService);
    }

    @Test
    void rejectsUnsupportedTenantStatusBeforeWriting() {
        CaresyncPrincipal actor = new CaresyncPrincipal(
            "platform-admin", null, "SUPER_ADMIN", null, "platform@example.test"
        );

        ValidationException exception = assertThrows(
            ValidationException.class,
            () -> service().updateStatus(actor, UUID.randomUUID(), "DELETED", null)
        );

        assertEquals("Unsupported tenant status", exception.getMessage());
        verify(tenantRlsContext).apply(actor, null);
        verifyNoInteractions(jdbc, auditService);
    }

    @Test
    void tenantEndpointsRequirePlatformRole() throws NoSuchMethodException {
        PreAuthorize authorization = AdminTenantController.class.getAnnotation(PreAuthorize.class);

        assertEquals("hasRole('SUPER_ADMIN')", authorization.value());
    }
}
