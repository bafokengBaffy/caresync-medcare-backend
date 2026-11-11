package health.caresync.patient;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.google.firebase.auth.ExportedUserRecord;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.ListUsersPage;
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
    void promotesOnlyVerifiedAllowlistedUserAndPreservesExistingClaims() throws Exception {
        UUID tenantId = UUID.randomUUID();
        FirebaseAuth firebaseAuth = mock(FirebaseAuth.class);
        TenantRepository tenants = mock(TenantRepository.class);
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        Tenant tenant = mock(Tenant.class);
        ExportedUserRecord user = mock(ExportedUserRecord.class);
        ListUsersPage page = mock(ListUsersPage.class);
        when(tenants.findAll()).thenReturn(List.of(tenant));
        when(tenant.getId()).thenReturn(tenantId);
        when(tenants.findBySubdomain("caresync")).thenReturn(Optional.of(tenant));
        when(user.getUid()).thenReturn("firebase-user-1");
        when(user.getEmail()).thenReturn("BAFFKAY20@gmail.com");
        when(user.isEmailVerified()).thenReturn(true);
        when(user.isDisabled()).thenReturn(false);
        when(user.getCustomClaims()).thenReturn(Map.of("specialty", "GENERAL"));
        when(page.getValues()).thenReturn(List.of(user));
        when(page.getNextPage()).thenReturn(null);
        when(firebaseAuth.listUsers(null)).thenReturn(page);

        FirebaseUserSyncService service = new FirebaseUserSyncService(
            firebaseAuth,
            tenants,
            jdbcTemplate,
            "baffkay20@gmail.com",
            "caresync"
        );

        service.syncAllUsers();

        verify(firebaseAuth).setCustomUserClaims("firebase-user-1", Map.of(
            "specialty", "GENERAL",
            "role", "ADMIN",
            "tenant_id", tenantId.toString()
        ));
        verify(jdbcTemplate).batchUpdate(anyString(), any(BatchPreparedStatementSetter.class));
    }

    @Test
    void promotesEveryVerifiedEmailInCommaSeparatedAllowlist() throws Exception {
        UUID tenantId = UUID.randomUUID();
        FirebaseAuth firebaseAuth = mock(FirebaseAuth.class);
        TenantRepository tenants = mock(TenantRepository.class);
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        Tenant tenant = mock(Tenant.class);
        ExportedUserRecord user = mock(ExportedUserRecord.class);
        ListUsersPage page = mock(ListUsersPage.class);
        when(tenants.findAll()).thenReturn(List.of(tenant));
        when(tenant.getId()).thenReturn(tenantId);
        when(tenants.findBySubdomain("caresync")).thenReturn(Optional.of(tenant));
        when(user.getUid()).thenReturn("firebase-user-allowlisted");
        when(user.getEmail()).thenReturn("maribemaribe43@gmail.com");
        when(user.isEmailVerified()).thenReturn(true);
        when(user.isDisabled()).thenReturn(false);
        when(user.getCustomClaims()).thenReturn(Map.of());
        when(page.getValues()).thenReturn(List.of(user));
        when(page.getNextPage()).thenReturn(null);
        when(firebaseAuth.listUsers(null)).thenReturn(page);

        FirebaseUserSyncService service = new FirebaseUserSyncService(
            firebaseAuth,
            tenants,
            jdbcTemplate,
            "baffkay20@gmail.com, maribemaribe43@gmail.com, kokikoki@gmail.com",
            "caresync"
        );

        service.syncAllUsers();

        verify(firebaseAuth).setCustomUserClaims("firebase-user-allowlisted", Map.of(
            "role", "ADMIN",
            "tenant_id", tenantId.toString()
        ));
    }

    @Test
    void doesNotPromoteUnverifiedAllowlistedUser() throws Exception {
        FirebaseAuth firebaseAuth = mock(FirebaseAuth.class);
        TenantRepository tenants = mock(TenantRepository.class);
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        ExportedUserRecord user = mock(ExportedUserRecord.class);
        ListUsersPage page = mock(ListUsersPage.class);
        when(tenants.findAll()).thenReturn(List.of());
        when(user.getUid()).thenReturn("firebase-user-2");
        when(user.getEmail()).thenReturn("baffkay20@gmail.com");
        when(user.isEmailVerified()).thenReturn(false);
        when(user.isDisabled()).thenReturn(false);
        when(user.getCustomClaims()).thenReturn(Map.of());
        when(page.getValues()).thenReturn(List.of(user));
        when(page.getNextPage()).thenReturn(null);
        when(firebaseAuth.listUsers(null)).thenReturn(page);

        FirebaseUserSyncService service = new FirebaseUserSyncService(
            firebaseAuth,
            tenants,
            jdbcTemplate,
            "baffkay20@gmail.com",
            "caresync"
        );

        service.syncAllUsers();

        verify(firebaseAuth, never()).setCustomUserClaims(eq("firebase-user-2"), any());
        verify(jdbcTemplate).batchUpdate(anyString(), any(BatchPreparedStatementSetter.class));
    }

    @Test
    void promotesConfiguredVerifiedTenantAdminWithTenantScopedRole() throws Exception {
        UUID tenantId = UUID.randomUUID();
        FirebaseAuth firebaseAuth = mock(FirebaseAuth.class);
        TenantRepository tenants = mock(TenantRepository.class);
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        Tenant tenant = mock(Tenant.class);
        ExportedUserRecord user = mock(ExportedUserRecord.class);
        ListUsersPage page = mock(ListUsersPage.class);
        when(tenants.findAll()).thenReturn(List.of(tenant));
        when(tenant.getId()).thenReturn(tenantId);
        when(tenants.findBySubdomain("caresync")).thenReturn(Optional.of(tenant));
        when(user.getUid()).thenReturn("firebase-koki-5713");
        when(user.getEmail()).thenReturn("KOKIKOKI5713@gmail.com");
        when(user.isEmailVerified()).thenReturn(true);
        when(user.isDisabled()).thenReturn(false);
        when(user.getCustomClaims()).thenReturn(Map.of());
        when(page.getValues()).thenReturn(List.of(user));
        when(page.getNextPage()).thenReturn(null);
        when(firebaseAuth.listUsers(null)).thenReturn(page);

        FirebaseUserSyncService service = new FirebaseUserSyncService(
            firebaseAuth,
            tenants,
            jdbcTemplate,
            "",
            "caresync",
            "",
            "kokikoki5713@gmail.com",
            null
        );

        service.syncAllUsers();

        verify(firebaseAuth).setCustomUserClaims("firebase-koki-5713", Map.of(
            "role", "TENANT_ADMIN",
            "tenant_id", tenantId.toString()
        ));
        verify(jdbcTemplate).batchUpdate(anyString(), any(BatchPreparedStatementSetter.class));
    }
}
