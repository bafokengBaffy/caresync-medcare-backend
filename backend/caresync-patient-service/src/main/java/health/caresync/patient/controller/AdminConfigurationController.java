package health.caresync.patient.controller;

import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.web.ApiResponse;
import health.caresync.patient.service.AdminConfigurationService;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminConfigurationController {
    private final AdminConfigurationService configurations;

    public AdminConfigurationController(AdminConfigurationService configurations) {
        this.configurations = configurations;
    }

    @GetMapping("/settings")
    public ResponseEntity<ApiResponse<JsonNode>> getSettings(
        @AuthenticationPrincipal CaresyncPrincipal actor
    ) {
        return ResponseEntity.ok(ApiResponse.ok(configurations.getPlatform(actor, "global")));
    }

    @PutMapping("/settings")
    public ResponseEntity<ApiResponse<JsonNode>> updateSettings(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @Valid @RequestBody JsonNode settings
    ) {
        return ResponseEntity.ok(ApiResponse.ok(configurations.putPlatform(actor, "global", settings)));
    }

    @GetMapping("/registration/settings")
    public ResponseEntity<ApiResponse<JsonNode>> getRegistrationSettings(
        @AuthenticationPrincipal CaresyncPrincipal actor
    ) {
        return ResponseEntity.ok(ApiResponse.ok(configurations.getPlatform(actor, "registration")));
    }

    @PutMapping("/registration/settings")
    public ResponseEntity<ApiResponse<JsonNode>> updateRegistrationSettings(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @Valid @RequestBody JsonNode settings
    ) {
        return ResponseEntity.ok(ApiResponse.ok(configurations.putPlatform(actor, "registration", settings)));
    }
}
