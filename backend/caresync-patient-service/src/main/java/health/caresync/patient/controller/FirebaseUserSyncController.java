package health.caresync.patient.controller;

import com.google.firebase.auth.FirebaseAuthException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.patient.service.FirebaseUserSyncService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@ConditionalOnProperty(name = "caresync.firebase.enabled", havingValue = "true")
public class FirebaseUserSyncController {
    private final FirebaseUserSyncService syncService;

    public FirebaseUserSyncController(FirebaseUserSyncService syncService) {
        this.syncService = syncService;
    }

    @PostMapping("/auth/sync")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserSyncResponse> syncCurrentUser(@AuthenticationPrincipal CaresyncPrincipal principal)
        throws FirebaseAuthException {
        FirebaseUserSyncService.ProvisionedUser provisioned = syncService.provisionCurrentUser(
            principal.userId(), principal.email()
        );
        return ResponseEntity.ok(new UserSyncResponse(
            true,
            provisioned.tenantId() == null ? null : provisioned.tenantId().toString(),
            provisioned.role(),
            provisioned.specialty(),
            "User synchronized."
        ));
    }

    @PostMapping("/admin/sync-users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> syncAllUsers() throws FirebaseAuthException {
        return ResponseEntity.ok(syncService.syncAllUsers());
    }

    public record UserSyncResponse(boolean synced, String tenantId, String role, String specialty, String message) { }
}
