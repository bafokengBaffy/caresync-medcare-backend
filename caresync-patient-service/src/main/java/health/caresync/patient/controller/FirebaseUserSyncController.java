package health.caresync.patient.controller;

import com.google.firebase.auth.FirebaseAuthException;
import health.caresync.patient.dto.FirebaseUserSyncResponse;
import health.caresync.patient.service.FirebaseUserSyncService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@ConditionalOnProperty(name = "caresync.firebase.enabled", havingValue = "true")
public class FirebaseUserSyncController {
    private final FirebaseUserSyncService syncService;

    public FirebaseUserSyncController(FirebaseUserSyncService syncService) {
        this.syncService = syncService;
    }

    @PostMapping("/sync-users")
    @PreAuthorize("hasRole('ADMIN')")
    public FirebaseUserSyncResponse syncUsers() throws FirebaseAuthException {
        return syncService.syncAllUsers();
    }
}
