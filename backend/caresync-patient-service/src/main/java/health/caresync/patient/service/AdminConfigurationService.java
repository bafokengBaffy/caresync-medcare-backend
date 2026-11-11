package health.caresync.patient.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.patient.domain.entity.AdminConfiguration;
import health.caresync.patient.domain.repository.AdminConfigurationRepository;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminConfigurationService {
    private final AdminConfigurationRepository configurations;
    private final TenantRlsContext tenantRlsContext;
    private final ObjectMapper objectMapper;

    public AdminConfigurationService(
        AdminConfigurationRepository configurations,
        TenantRlsContext tenantRlsContext,
        ObjectMapper objectMapper
    ) {
        this.configurations = configurations;
        this.tenantRlsContext = tenantRlsContext;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public JsonNode getPlatform(CaresyncPrincipal actor, String key) {
        requirePlatformAdmin(actor);
        tenantRlsContext.apply(actor, null);
        return configurations.findByScopeAndConfigurationKeyAndTenantIdIsNull("PLATFORM", key)
            .map(this::read)
            .orElseGet(() -> defaultPlatformConfiguration(key));
    }

    @Transactional
    public JsonNode putPlatform(CaresyncPrincipal actor, String key, JsonNode value) {
        requirePlatformAdmin(actor);
        tenantRlsContext.apply(actor, null);
        return save("PLATFORM", null, key, value, actor);
    }

    @Transactional(readOnly = true)
    public JsonNode getTenant(CaresyncPrincipal actor, String key) {
        UUID tenantId = requireTenantAdmin(actor);
        tenantRlsContext.apply(actor, tenantId);
        return configurations.findByScopeAndConfigurationKeyAndTenantId("TENANT", key, tenantId)
            .map(this::read)
            .orElseGet(objectMapper::createObjectNode);
    }

    @Transactional
    public JsonNode putTenant(CaresyncPrincipal actor, String key, JsonNode value) {
        UUID tenantId = requireTenantAdmin(actor);
        tenantRlsContext.apply(actor, tenantId);
        return save("TENANT", tenantId, key, value, actor);
    }

    private JsonNode save(String scope, UUID tenantId, String key, JsonNode value, CaresyncPrincipal actor) {
        if (value == null || !value.isObject()) {
            throw new IllegalArgumentException("Configuration must be a JSON object");
        }
        AdminConfiguration configuration = tenantId == null
            ? configurations.findByScopeAndConfigurationKeyAndTenantIdIsNull(scope, key).orElseGet(AdminConfiguration::new)
            : configurations.findByScopeAndConfigurationKeyAndTenantId(scope, key, tenantId).orElseGet(AdminConfiguration::new);
        configuration.setScope(scope);
        configuration.setTenantId(tenantId);
        configuration.setConfigurationKey(key);
        configuration.setConfigurationValue(write(value));
        configuration.setUpdatedBy(actor.userId());
        configuration.setUpdatedAt(Instant.now());
        return read(configurations.save(configuration));
    }

    private JsonNode read(AdminConfiguration configuration) {
        try {
            return objectMapper.readTree(configuration.getConfigurationValue());
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Stored admin configuration is invalid JSON", exception);
        }
    }

    private String write(JsonNode value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Could not encode configuration", exception);
        }
    }

    private JsonNode defaultPlatformConfiguration(String key) {
        ObjectNode defaults = objectMapper.createObjectNode();
        if ("global".equals(key)) {
            defaults.put("maintenanceMode", false);
            defaults.put("allowRegistration", true);
            defaults.put("enforceMfa", false);
            defaults.put("sessionTimeoutMinutes", 60);
            defaults.put("maxLoginAttempts", 5);
            defaults.put("passwordMinLength", 12);
            defaults.put("supportEmail", "support@caresync.com");
            defaults.put("apiRateLimit", 1000);
            defaults.put("defaultTenantPlan", "FREE");
            defaults.put("enableAuditLogging", true);
            defaults.put("webhookUrl", "");
        } else if ("registration".equals(key)) {
            defaults.put("publicSignupEnabled", true);
            defaults.putArray("allowedPublicRoles").add("PATIENT");
            defaults.put("requireEmailVerification", true);
            defaults.put("autoApprovePublicSignup", false);
            defaults.put("allowGoogleSignup", true);
            defaults.put("allowMicrosoftSignup", false);
            defaults.put("allowAppleSignup", false);
            defaults.put("allowPasswordSignup", true);
            defaults.putArray("allowedEmailDomains");
            defaults.put("blockDisposableEmails", true);
            defaults.put("requestExpiryDays", 14);
            defaults.put("autoRejectAfterDays", 30);
            defaults.put("notifyAdminsOnNewRequest", true);
            defaults.put("notifyApplicantOnDecision", true);
            defaults.put("defaultTenantId", "");
            defaults.put("defaultRole", "PATIENT");
            defaults.putArray("defaultPermissions");
            defaults.put("requireAdminApprovalForAllRoles", true);
            defaults.put("enableAuditOnRequest", true);
            defaults.put("maxRequestsPerIpPerDay", 10);
            defaults.put("requireInviteCode", false);
            defaults.put("maxSignupAttemptsPerEmail", 3);
            defaults.put("invitationExpiryDays", 7);
            defaults.put("invitationMaxResends", 3);
            defaults.put("requireMfaOnFirstLogin", false);
            defaults.put("forcePasswordResetOnFirstLogin", true);
        }
        return defaults;
    }

    private static void requirePlatformAdmin(CaresyncPrincipal actor) {
        if (actor == null || !"SUPER_ADMIN".equals(actor.role())) {
            throw new ForbiddenException("Platform super-admin role required");
        }
    }

    private static UUID requireTenantAdmin(CaresyncPrincipal actor) {
        if (actor == null || !"TENANT_ADMIN".equals(actor.role()) || actor.tenantId() == null) {
            throw new ForbiddenException("Tenant administrator role and tenant claim required");
        }
        return actor.tenantId();
    }
}
