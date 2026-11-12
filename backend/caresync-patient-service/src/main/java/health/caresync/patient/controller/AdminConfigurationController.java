package health.caresync.patient.controller;

import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.web.ApiResponse;
import health.caresync.patient.service.AdminConfigurationService;
import health.caresync.patient.service.AuditService;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminConfigurationController {
    private final AdminConfigurationService configurations;
    private final AuditService auditService;

    public AdminConfigurationController(AdminConfigurationService configurations, AuditService auditService) {
        this.configurations = configurations;
        this.auditService = auditService;
    }

    @GetMapping("/settings")
    public ResponseEntity<ApiResponse<JsonNode>> getSettings(
        @AuthenticationPrincipal CaresyncPrincipal actor
    ) {
        var snapshot = configurations.getPlatform(actor, "global");
        return ResponseEntity.ok().eTag(Long.toString(snapshot.revision())).body(ApiResponse.ok(snapshot.settings()));
    }

    @PutMapping("/settings")
    @Transactional
    public ResponseEntity<ApiResponse<JsonNode>> updateSettings(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @RequestHeader(value = "If-Match", required = false) String ifMatch,
        @Valid @RequestBody JsonNode settings,
        HttpServletRequest request
    ) {
        return update(actor, "global", settings, expectedRevision(ifMatch), request);
    }

    @Transactional
    private ResponseEntity<ApiResponse<JsonNode>> update(CaresyncPrincipal actor, String key, JsonNode settings, long revision, HttpServletRequest request) {
        var snapshot = configurations.putPlatform(actor, key, settings, revision);
        auditService.recordAdministrativeAction(actor, null, "UPDATE_PLATFORM_CONFIGURATION", "admin_configuration", key, request);
        return ResponseEntity.ok().eTag(Long.toString(snapshot.revision())).body(ApiResponse.ok(snapshot.settings()));
    }

    @GetMapping("/registration/settings")
    public ResponseEntity<ApiResponse<JsonNode>> getRegistrationSettings(
        @AuthenticationPrincipal CaresyncPrincipal actor
    ) {
        var snapshot = configurations.getPlatform(actor, "registration");
        return ResponseEntity.ok().eTag(Long.toString(snapshot.revision())).body(ApiResponse.ok(snapshot.settings()));
    }

    @PutMapping("/registration/settings")
    @Transactional
    public ResponseEntity<ApiResponse<JsonNode>> updateRegistrationSettings(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @RequestHeader(value = "If-Match", required = false) String ifMatch,
        @Valid @RequestBody JsonNode settings,
        HttpServletRequest request
    ) {
        return update(actor, "registration", settings, expectedRevision(ifMatch), request);
    }

    private static long expectedRevision(String ifMatch) {
        if (ifMatch == null || ifMatch.isBlank()) throw new org.springframework.web.server.ResponseStatusException(
            HttpStatus.PRECONDITION_REQUIRED, "If-Match configuration revision is required");
        String value = ifMatch.trim().replace("\"", "");
        if (!value.matches("[0-9]{1,18}")) throw new org.springframework.web.server.ResponseStatusException(
            HttpStatus.BAD_REQUEST, "If-Match must contain the loaded numeric configuration revision");
        try { return Long.parseLong(value); } catch (NumberFormatException exception) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid configuration revision");
        }
    }
}
