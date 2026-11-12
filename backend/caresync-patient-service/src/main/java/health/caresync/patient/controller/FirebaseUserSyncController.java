package health.caresync.patient.controller;

import com.google.firebase.auth.FirebaseAuthException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.patient.service.FirebaseUserSyncService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@ConditionalOnProperty(name = "caresync.firebase.enabled", havingValue = "true")
public class FirebaseUserSyncController {
    private final FirebaseUserSyncService syncService;
    private final JdbcTemplate jdbcTemplate;

    public FirebaseUserSyncController(FirebaseUserSyncService syncService, JdbcTemplate jdbcTemplate) {
        this.syncService = syncService;
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostMapping("/auth/sync")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserSyncResponse> syncCurrentUser(@AuthenticationPrincipal CaresyncPrincipal principal)
        throws FirebaseAuthException {
        FirebaseUserSyncService.ProvisionedUser provisioned = syncService.provisionCurrentUser(
            principal.userId(), principal.email()
        );
        return ResponseEntity.ok(new UserSyncResponse(
            "PROVISIONED".equals(provisioned.status()),
            provisioned.status(),
            provisioned.tenantId() == null ? null : provisioned.tenantId().toString(),
            provisioned.role(),
            provisioned.specialty(),
            "PROVISIONED".equals(provisioned.status())
                ? "User synchronized."
                : "Registration is awaiting administrator approval."
        ));
    }

    @GetMapping("/auth/pending-status")
    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public ResponseEntity<PendingStatusResponse> pendingStatus(
        @AuthenticationPrincipal CaresyncPrincipal principal
    ) {
        jdbcTemplate.queryForObject(
            "select set_config('app.firebase_uid', ?, true)",
            String.class,
            principal.userId()
        );
        jdbcTemplate.queryForObject(
            "select set_config('app.is_super_admin', ?, true)",
            String.class,
            Boolean.toString("SUPER_ADMIN".equals(principal.role()))
        );
        PendingStatusResponse result = jdbcTemplate.query("""
            SELECT status, rejection_reason, submitted_at
            FROM registration_requests
            WHERE firebase_uid = ?
            ORDER BY submitted_at DESC
            LIMIT 1
            """,
            statement -> statement.setString(1, principal.userId()),
            resultSet -> resultSet.next()
                ? new PendingStatusResponse(
                    resultSet.getString("status"),
                    resultSet.getString("rejection_reason"),
                    resultSet.getTimestamp("submitted_at").toInstant()
                )
                : new PendingStatusResponse("NOT_SUBMITTED", null, null)
        );
        return ResponseEntity.ok(result);
    }

    @PostMapping("/admin/sync-users")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> syncAllUsers() throws FirebaseAuthException {
        return ResponseEntity.ok(syncService.syncAllUsers());
    }

    public record UserSyncResponse(
        boolean synced,
        String status,
        String tenantId,
        String role,
        String specialty,
        String message
    ) { }

    public record PendingStatusResponse(String status, String rejectionReason, java.time.Instant submittedAt) { }
}
