package health.caresync.patient.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.web.ApiResponse;
import health.caresync.patient.service.AdminConfigurationService;
import health.caresync.patient.service.AuditService;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
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
@RequestMapping("/api/v1/tenant/settings")
@PreAuthorize("hasRole('TENANT_ADMIN')")
public class TenantAdminSettingsController {
    private final AdminConfigurationService configurations;
    private final ObjectMapper objectMapper;
    private final AuditService auditService;

    public TenantAdminSettingsController(
        AdminConfigurationService configurations,
        ObjectMapper objectMapper,
        AuditService auditService
    ) {
        this.configurations = configurations;
        this.objectMapper = objectMapper;
        this.auditService = auditService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<JsonNode>> getSettings(
        @AuthenticationPrincipal CaresyncPrincipal actor
    ) {
        var snapshot = configurations.getTenant(actor, "profile");
        JsonNode settings = snapshot.settings();
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
        return ResponseEntity.ok().eTag(Long.toString(snapshot.revision())).body(ApiResponse.ok(settings));
    }

    @PutMapping
    @Transactional
    public ResponseEntity<ApiResponse<JsonNode>> updateSettings(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @RequestHeader(value = "If-Match", required = false) String ifMatch,
        @Valid @RequestBody JsonNode settings,
        HttpServletRequest request
    ) {
        return update(actor, settings, expectedRevision(ifMatch), request);
    }

    @Transactional
    private ResponseEntity<ApiResponse<JsonNode>> update(CaresyncPrincipal actor, JsonNode settings, long revision, HttpServletRequest request) {
        var snapshot = configurations.putTenant(actor, "profile", settings, revision);
        auditService.recordAdministrativeAction(actor, actor.tenantId(), "UPDATE_TENANT_CONFIGURATION", "tenant_configuration", "profile", request);
        return ResponseEntity.ok().eTag(Long.toString(snapshot.revision())).body(ApiResponse.ok(snapshot.settings()));
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
