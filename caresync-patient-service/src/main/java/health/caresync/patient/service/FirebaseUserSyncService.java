package health.caresync.patient.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.ListUsersPage;
import health.caresync.common.exception.ValidationException;
import health.caresync.patient.domain.repository.TenantRepository;
import health.caresync.patient.dto.FirebaseUserSyncResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "caresync.firebase.enabled", havingValue = "true")
public class FirebaseUserSyncService {
    private static final Logger LOGGER = LoggerFactory.getLogger(FirebaseUserSyncService.class);
    private static final String UPSERT_SQL = """
        INSERT INTO firebase_users (firebase_uid, email, role, tenant_id, disabled, synced_at)
        VALUES (?, ?, ?, ?, ?, NOW())
        ON CONFLICT (firebase_uid) DO UPDATE SET
          email = EXCLUDED.email,
          role = EXCLUDED.role,
          tenant_id = EXCLUDED.tenant_id,
          disabled = EXCLUDED.disabled,
          synced_at = NOW()
        """;

    private final FirebaseAuth firebaseAuth;
    private final TenantRepository tenants;
    private final JdbcTemplate jdbcTemplate;

    public FirebaseUserSyncService(
        FirebaseAuth firebaseAuth,
        TenantRepository tenants,
        JdbcTemplate jdbcTemplate
    ) {
        this.firebaseAuth = firebaseAuth;
        this.tenants = tenants;
        this.jdbcTemplate = jdbcTemplate;
    }

    public FirebaseUserSyncResponse syncAllUsers() throws FirebaseAuthException {
        Set<UUID> existingTenants = tenants.findAll().stream()
            .map(tenant -> tenant.getId())
            .collect(java.util.stream.Collectors.toUnmodifiableSet());
        int synced = 0;
        int withoutTenant = 0;
        int pages = 0;
        ListUsersPage page = firebaseAuth.listUsers(null);
        while (page != null) {
            List<SyncUser> batch = new ArrayList<>();
            for (var user : page.getValues()) {
                UUID tenantId = tenantId(user.getCustomClaims().get("tenant_id"), existingTenants);
                if (tenantId == null) {
                    withoutTenant++;
                }
                Object claimRole = user.getCustomClaims().get("role");
                String role = claimRole instanceof String value && !value.isBlank() ? value : null;
                batch.add(new SyncUser(user.getUid(), user.getEmail(), role, tenantId, user.isDisabled()));
            }
            writeBatch(batch);
            synced += batch.size();
            pages++;
            page = page.getNextPage();
        }
        LOGGER.info("Synced {} Firebase Auth users across {} pages; {} users have no existing tenant mapping",
            synced, pages, withoutTenant);
        return new FirebaseUserSyncResponse(synced, withoutTenant, pages);
    }

    @Scheduled(
        fixedDelayString = "${caresync.firebase.user-sync-interval-ms:900000}",
        initialDelayString = "${caresync.firebase.user-sync-initial-delay-ms:60000}"
    )
    public void scheduledSync() {
        try {
            syncAllUsers();
        } catch (FirebaseAuthException | RuntimeException exception) {
            LOGGER.error("Scheduled Firebase-to-Postgres user sync failed", exception);
        }
    }

    private void writeBatch(List<SyncUser> users) {
        if (users.isEmpty()) {
            return;
        }
        jdbcTemplate.batchUpdate(UPSERT_SQL, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement statement, int index) throws SQLException {
                SyncUser user = users.get(index);
                statement.setString(1, user.uid());
                statement.setString(2, user.email());
                statement.setString(3, user.role());
                statement.setObject(4, user.tenantId());
                statement.setBoolean(5, user.disabled());
            }

            @Override
            public int getBatchSize() {
                return users.size();
            }
        });
    }

    private static UUID tenantId(Object claim, Set<UUID> existingTenants) {
        if (!(claim instanceof String value) || value.isBlank()) {
            return null;
        }
        try {
            UUID id = UUID.fromString(value);
            return existingTenants.contains(id) ? id : null;
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    private record SyncUser(String uid, String email, String role, UUID tenantId, boolean disabled) { }
}
