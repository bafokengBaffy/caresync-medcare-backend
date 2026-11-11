package health.caresync.patient.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.web.ApiResponse;
import health.caresync.patient.service.AdminConfigurationService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tenant/settings")
@PreAuthorize("hasRole('TENANT_ADMIN')")
public class TenantAdminSettingsController {
    private final AdminConfigurationService configurations;
    private final ObjectMapper objectMapper;

    public TenantAdminSettingsController(
        AdminConfigurationService configurations,
        ObjectMapper objectMapper
    ) {
        this.configurations = configurations;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<JsonNode>> getSettings(
        @AuthenticationPrincipal CaresyncPrincipal actor
    ) {
        JsonNode settings = configurations.getTenant(actor, "profile");
        if (settings.isObject() && settings.isEmpty()) {
            ObjectNode defaults = ((ObjectNode) settings);
            defaults.put("name", "Clinic");
            defaults.put("description", "");
            defaults.put("logoUrl", "");
            defaults.put("primaryColor", "#0ea5e9");
            defaults.put("contactEmail", actor.email() == null ? "" : actor.email());
            defaults.put("contactPhone", "");
            defaults.put("website", "");
            defaults.put("address", "");
            defaults.put("city", "");
            defaults.put("country", "");
            defaults.put("timezone", "Africa/Maseru");
            defaults.set("operatingHours", objectMapper.valueToTree(Map.of(
                "monday", "08:00 - 17:00", "tuesday", "08:00 - 17:00",
                "wednesday", "08:00 - 17:00", "thursday", "08:00 - 17:00",
                "friday", "08:00 - 17:00", "saturday", "09:00 - 13:00",
                "sunday", "Closed"
            )));
            defaults.put("notifyOnNewPatient", true);
            defaults.put("notifyOnNewAppointment", true);
            defaults.put("notifyOnInvoicePaid", false);
            defaults.put("notifyOnLowStock", true);
            defaults.put("defaultLanguage", "en");
            defaults.put("currency", "LSL");
            settings = defaults;
        }
        return ResponseEntity.ok(ApiResponse.ok(settings));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<JsonNode>> updateSettings(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @Valid @RequestBody JsonNode settings
    ) {
        return ResponseEntity.ok(ApiResponse.ok(configurations.putTenant(actor, "profile", settings)));
    }

}
