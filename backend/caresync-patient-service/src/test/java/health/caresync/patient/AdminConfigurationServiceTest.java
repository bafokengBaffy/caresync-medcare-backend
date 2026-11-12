package health.caresync.patient;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import health.caresync.common.exception.ConflictException;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.patient.domain.entity.AdminConfiguration;
import health.caresync.patient.domain.repository.AdminConfigurationRepository;
import health.caresync.patient.service.AdminConfigurationService;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class AdminConfigurationServiceTest {
    @Test
    void rejectsUnknownPlatformSettingFields() throws Exception {
        AdminConfigurationRepository repository = mock(AdminConfigurationRepository.class);
        TenantRlsContext tenantRlsContext = mock(TenantRlsContext.class);
        AdminConfigurationService service = new AdminConfigurationService(repository, tenantRlsContext, new ObjectMapper());
        CaresyncPrincipal actor = new CaresyncPrincipal("super-admin", null, "SUPER_ADMIN", null, "admin@example.test");

        assertThrows(ValidationException.class, () -> service.putPlatform(
            actor, "global", new ObjectMapper().readTree("{\"maintenanceMode\":true,\"unknownPolicy\":true}"), 0
        ));
        verify(repository, never()).saveAndFlush(any(AdminConfiguration.class));
    }

    @Test
    void rejectsStaleConfigurationRevisionWithoutWriting() throws Exception {
        AdminConfigurationRepository repository = mock(AdminConfigurationRepository.class);
        TenantRlsContext tenantRlsContext = mock(TenantRlsContext.class);
        AdminConfiguration stored = new AdminConfiguration();
        stored.setRevision(4);
        when(repository.findByScopeAndConfigurationKeyAndTenantIdIsNull("PLATFORM", "global"))
            .thenReturn(Optional.of(stored));
        AdminConfigurationService service = new AdminConfigurationService(repository, tenantRlsContext, new ObjectMapper());
        CaresyncPrincipal actor = new CaresyncPrincipal("super-admin", null, "SUPER_ADMIN", null, "admin@example.test");

        assertThrows(ConflictException.class, () -> service.putPlatform(
            actor, "global", new ObjectMapper().readTree("{\"maintenanceMode\":true}"), 3
        ));
        verify(repository, never()).saveAndFlush(any(AdminConfiguration.class));
    }

    @Test
    void tenantAdminCannotReadPlatformSettings() {
        AdminConfigurationService service = new AdminConfigurationService(
            mock(AdminConfigurationRepository.class), mock(TenantRlsContext.class), new ObjectMapper()
        );
        CaresyncPrincipal actor = new CaresyncPrincipal("tenant-admin", UUID.randomUUID(), "TENANT_ADMIN", null, "tenant@example.test");

        assertThrows(health.caresync.common.exception.ForbiddenException.class, () -> service.getPlatform(actor, "global"));
    }
}
