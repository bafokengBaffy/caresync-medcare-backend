package health.caresync.patient;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.patient.domain.entity.Tenant;
import health.caresync.patient.domain.repository.TenantRepository;
import health.caresync.patient.service.FirebaseUserSyncService;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;

class FirebaseUserSyncServiceTest {
    @Test
    void configuredTenantAdminIsAssignedToConfiguredTenantDespiteStaleTenantClaim() throws Exception {
        FirebaseAuth firebaseAuth = mock(FirebaseAuth.class);
        TenantRepository tenants = mock(TenantRepository.class);
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        TenantRlsContext tenantRlsContext = mock(TenantRlsContext.class);
        UserRecord user = mock(UserRecord.class);
        UUID staleTenantId = UUID.randomUUID();
        UUID configuredTenantId = UUID.randomUUID();
        Tenant staleTenant = tenant(staleTenantId, "other-clinic");
        Tenant configuredTenant = tenant(configuredTenantId, "caresync");

        when(firebaseAuth.getUser("firebase-uid")).thenReturn(user);
        when(user.getCustomClaims()).thenReturn(Map.of(
            "role", "SUPER_ADMIN",
            "tenant_id", staleTenantId.toString()
        ));
        when(user.getEmail()).thenReturn("KokiKoki5713@gmail.com");
        when(user.isEmailVerified()).thenReturn(true);
        when(tenants.findAll()).thenReturn(List.of(staleTenant, configuredTenant));
        when(tenants.findBySubdomain("caresync")).thenReturn(Optional.of(configuredTenant));

        FirebaseUserSyncService service = new FirebaseUserSyncService(
            firebaseAuth,
            tenants,
            jdbcTemplate,
            "",
            "caresync",
            "baffkay20@gmail.com",
            "kokikoki5713@gmail.com",
            tenantRlsContext
        );

        var provisioned = service.provisionCurrentUser("firebase-uid", "KokiKoki5713@gmail.com");

        assertEquals("TENANT_ADMIN", provisioned.role());
        assertEquals(configuredTenantId, provisioned.tenantId());
        verify(firebaseAuth).setCustomUserClaims(anyString(), anyMap());
        verify(jdbcTemplate).batchUpdate(anyString(), any(BatchPreparedStatementSetter.class));
    }

    private static Tenant tenant(UUID id, String subdomain) {
        Tenant tenant = new Tenant();
        tenant.setId(id);
        tenant.setSubdomain(subdomain);
        tenant.setName(subdomain);
        return tenant;
    }
}
