package health.caresync.patient.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.exception.ConflictException;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.patient.domain.entity.AdminConfiguration;
import health.caresync.patient.domain.repository.AdminConfigurationRepository;
import java.time.Instant;
import java.time.ZoneId;
import java.net.URI;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
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
    public VersionedConfiguration getPlatform(CaresyncPrincipal actor, String key) {
        requirePlatformAdmin(actor);
        tenantRlsContext.apply(actor, null);
        return configurations.findByScopeAndConfigurationKeyAndTenantIdIsNull("PLATFORM", key)
            .map(this::snapshot)
            .orElseGet(() -> new VersionedConfiguration(defaultPlatformConfiguration(key), 0, null, null));
    }

    @Transactional
    public VersionedConfiguration putPlatform(CaresyncPrincipal actor, String key, JsonNode value, long expectedRevision) {
        requirePlatformAdmin(actor);
        tenantRlsContext.apply(actor, null);
        return save("PLATFORM", null, key, value, actor, expectedRevision);
    }

    @Transactional(readOnly = true)
    public VersionedConfiguration getTenant(CaresyncPrincipal actor, String key) {
        UUID tenantId = requireTenantAdmin(actor);
        tenantRlsContext.apply(actor, tenantId);
        return configurations.findByScopeAndConfigurationKeyAndTenantId("TENANT", key, tenantId)
            .map(this::snapshot)
            .orElseGet(() -> new VersionedConfiguration(objectMapper.createObjectNode(), 0, null, null));
    }

    @Transactional
    public VersionedConfiguration putTenant(CaresyncPrincipal actor, String key, JsonNode value, long expectedRevision) {
        UUID tenantId = requireTenantAdmin(actor);
        tenantRlsContext.apply(actor, tenantId);
        return save("TENANT", tenantId, key, value, actor, expectedRevision);
    }

    private VersionedConfiguration save(String scope, UUID tenantId, String key, JsonNode value, CaresyncPrincipal actor, long expectedRevision) {
        if (value == null || !value.isObject()) {
            throw new ValidationException("Configuration must be a JSON object");
        }
        var existing = tenantId == null
            ? configurations.findByScopeAndConfigurationKeyAndTenantIdIsNull(scope, key)
            : configurations.findByScopeAndConfigurationKeyAndTenantId(scope, key, tenantId);
        AdminConfiguration configuration = existing.orElseGet(AdminConfiguration::new);
        long currentRevision = existing.map(AdminConfiguration::getRevision).orElse(0L);
        if (expectedRevision != currentRevision) {
            throw new ConflictException("Configuration changed since it was loaded; reload and compare before saving");
        }
        validateConfiguration(scope, key, value);
        configuration.setScope(scope);
        configuration.setTenantId(tenantId);
        configuration.setConfigurationKey(key);
        configuration.setConfigurationValue(write(value));
        configuration.setUpdatedBy(actor.userId());
        configuration.setUpdatedAt(Instant.now());
        try {
            return snapshot(configurations.saveAndFlush(configuration));
        } catch (ObjectOptimisticLockingFailureException exception) {
            throw new ConflictException("Configuration changed during save; reload and compare before retrying");
        }
    }

    private VersionedConfiguration snapshot(AdminConfiguration configuration) {
        return new VersionedConfiguration(read(configuration), configuration.getRevision(),
            configuration.getUpdatedAt(), configuration.getUpdatedBy());
    }

    private void validateConfiguration(String scope, String key, JsonNode value) {
        Set<String> allowed = switch (scope + ":" + key) {
            case "PLATFORM:global" -> Set.of("maintenanceMode", "allowRegistration", "enforceMfa",
                "sessionTimeoutMinutes", "maxLoginAttempts", "passwordMinLength", "supportEmail",
                "apiRateLimit", "defaultTenantPlan", "enableAuditLogging", "webhookUrl");
            case "PLATFORM:registration" -> Set.of("publicSignupEnabled", "allowedPublicRoles",
                "requireEmailVerification", "autoApprovePublicSignup", "allowGoogleSignup",
                "allowMicrosoftSignup", "allowAppleSignup", "allowPasswordSignup", "allowedEmailDomains",
                "blockDisposableEmails", "requestExpiryDays", "autoRejectAfterDays", "notifyAdminsOnNewRequest",
                "notifyApplicantOnDecision", "defaultTenantId", "defaultRole", "defaultPermissions",
                "requireAdminApprovalForAllRoles", "enableAuditOnRequest", "maxRequestsPerIpPerDay",
                "requireInviteCode", "maxSignupAttemptsPerEmail", "invitationExpiryDays", "invitationMaxResends",
                "requireMfaOnFirstLogin", "forcePasswordResetOnFirstLogin");
            case "TENANT:profile" -> Set.of("name", "description", "logoUrl", "primaryColor", "contactEmail",
                "contactPhone", "website", "address", "city", "country", "timezone", "operatingHours",
                "notifyOnNewPatient", "notifyOnNewAppointment", "notifyOnInvoicePaid", "notifyOnLowStock",
                "defaultLanguage", "currency");
            default -> "PLATFORM".equals(scope) && key.startsWith("role:")
                ? Set.of("PATIENT_READ", "PATIENT_WRITE", "PATIENT_DELETE", "BILLING_READ", "BILLING_WRITE",
                    "BILLING_DELETE", "APPOINTMENT_READ", "APPOINTMENT_WRITE", "CLINICAL_NOTE_READ",
                    "CLINICAL_NOTE_WRITE", "USER_MANAGE", "TENANT_MANAGE", "AUDIT_READ", "SETTINGS_MANAGE")
                : throwUnsupportedConfiguration();
        };
        value.fieldNames().forEachRemaining(field -> {
            if (!allowed.contains(field)) throw new ValidationException("Unsupported configuration field: " + field);
        });
        if ("PLATFORM".equals(scope) && "global".equals(key)) validateGlobal(value);
        if ("PLATFORM".equals(scope) && "registration".equals(key)) validateRegistration(value);
        if ("TENANT".equals(scope) && "profile".equals(key)) validateTenantProfile(value);
        if ("PLATFORM".equals(scope) && key.startsWith("role:")) {
            value.fields().forEachRemaining(field -> {
                if (!field.getValue().isBoolean()) throw new ValidationException("Role permissions must be boolean values");
            });
        }
    }

    private static Set<String> throwUnsupportedConfiguration() {
        throw new ValidationException("Unsupported configuration scope or key");
    }

    private static void validateGlobal(JsonNode v) {
        bool(v, "maintenanceMode"); bool(v, "allowRegistration"); bool(v, "enforceMfa"); bool(v, "enableAuditLogging");
        integer(v, "sessionTimeoutMinutes", 5, 1440); integer(v, "maxLoginAttempts", 1, 20);
        integer(v, "passwordMinLength", 8, 64); integer(v, "apiRateLimit", 10, 10000);
        text(v, "supportEmail", 254); text(v, "webhookUrl", 2048);
        if (v.has("supportEmail") && !v.get("supportEmail").asText().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"))
            throw new ValidationException("supportEmail must be a valid email address");
        if (v.has("webhookUrl") && !v.get("webhookUrl").asText().isBlank()) validateWebUrl(v.get("webhookUrl").asText(), "webhookUrl");
        if (v.has("defaultTenantPlan") && !Set.of("FREE", "PRO", "ENTERPRISE").contains(v.get("defaultTenantPlan").asText()))
            throw new ValidationException("Unsupported defaultTenantPlan");
    }

    private static void validateRegistration(JsonNode v) {
        for (String field : Set.of("publicSignupEnabled", "requireEmailVerification", "autoApprovePublicSignup", "allowGoogleSignup",
            "allowMicrosoftSignup", "allowAppleSignup", "allowPasswordSignup", "blockDisposableEmails", "notifyAdminsOnNewRequest",
            "notifyApplicantOnDecision", "requireAdminApprovalForAllRoles", "enableAuditOnRequest", "requireInviteCode",
            "requireMfaOnFirstLogin", "forcePasswordResetOnFirstLogin")) bool(v, field);
        for (String field : Set.of("requestExpiryDays", "autoRejectAfterDays", "maxRequestsPerIpPerDay", "maxSignupAttemptsPerEmail",
            "invitationExpiryDays", "invitationMaxResends")) integer(v, field, 1, 365);
        text(v, "defaultTenantId", 64); text(v, "defaultRole", 40);
        if (v.has("defaultRole") && !Set.of("PATIENT", "PROVIDER", "STAFF", "RECEPTION", "FINANCE", "MANAGER").contains(v.get("defaultRole").asText()))
            throw new ValidationException("Unsupported defaultRole");
        arrayOfStrings(v, "allowedPublicRoles", Set.of("PATIENT"), 10);
        arrayOfStrings(v, "defaultPermissions", null, 100);
        arrayOfStrings(v, "allowedEmailDomains", null, 100);
    }

    private static void validateTenantProfile(JsonNode v) {
        text(v, "name", 160); text(v, "description", 500); text(v, "contactEmail", 254);
        text(v, "contactPhone", 40); text(v, "address", 300); text(v, "city", 120); text(v, "country", 120);
        text(v, "defaultLanguage", 12); text(v, "currency", 3); text(v, "primaryColor", 7);
        for (String field : Set.of("notifyOnNewPatient", "notifyOnNewAppointment", "notifyOnInvoicePaid", "notifyOnLowStock")) bool(v, field);
        if (v.has("contactEmail") && !v.get("contactEmail").asText().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"))
            throw new ValidationException("contactEmail must be a valid email address");
        if (v.has("logoUrl") && !v.get("logoUrl").asText().isBlank()) validateWebUrl(v.get("logoUrl").asText(), "logoUrl");
        if (v.has("website") && !v.get("website").asText().isBlank()) validateWebUrl(v.get("website").asText(), "website");
        if (v.has("primaryColor") && !v.get("primaryColor").asText().matches("^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$"))
            throw new ValidationException("primaryColor must be a hex color");
        if (v.has("timezone")) try { ZoneId.of(v.get("timezone").asText()); } catch (RuntimeException e) { throw new ValidationException("timezone must be a valid IANA time zone"); }
        if (v.has("currency") && !Set.of("LSL", "ZAR", "USD").contains(v.get("currency").asText())) throw new ValidationException("Unsupported currency");
        if (v.has("operatingHours")) {
            JsonNode hours = v.get("operatingHours");
            Set<String> weekdays = Set.of("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday");
            if (!hours.isObject() || !hours.fieldNames().hasNext()) throw new ValidationException("operatingHours must contain weekday schedules");
            hours.fieldNames().forEachRemaining(day -> { if (!weekdays.contains(day) || !hours.get(day).isTextual() || hours.get(day).asText().length() > 40) throw new ValidationException("Invalid operatingHours schedule"); });
        }
    }

    private static void bool(JsonNode v, String key) { if (v.has(key) && !v.get(key).isBoolean()) throw new ValidationException(key + " must be a boolean"); }
    private static void integer(JsonNode v, String key, int min, int max) {
        if (v.has(key) && (!v.get(key).isIntegralNumber() || !v.get(key).canConvertToInt() || v.get(key).asInt() < min || v.get(key).asInt() > max))
            throw new ValidationException(key + " must be an integer between " + min + " and " + max);
    }
    private static void text(JsonNode v, String key, int max) {
        if (v.has(key) && (!v.get(key).isTextual() || v.get(key).asText().length() > max)) throw new ValidationException(key + " must be text of at most " + max + " characters");
    }
    private static void arrayOfStrings(JsonNode v, String key, Set<String> allowed, int maxItems) {
        if (!v.has(key)) return;
        JsonNode array = v.get(key);
        if (!array.isArray() || array.size() > maxItems) throw new ValidationException(key + " must be a bounded array");
        for (JsonNode item : array) {
            if (!item.isTextual() || item.asText().length() > 254 || (allowed != null && !allowed.contains(item.asText())))
                throw new ValidationException("Invalid value in " + key);
        }
    }
    private static void validateWebUrl(String value, String key) {
        try {
            URI uri = URI.create(value);
            if (!("https".equalsIgnoreCase(uri.getScheme()) || "http".equalsIgnoreCase(uri.getScheme())) || uri.getHost() == null || uri.getUserInfo() != null)
                throw new IllegalArgumentException();
        } catch (IllegalArgumentException e) { throw new ValidationException(key + " must be a valid HTTP(S) URL"); }
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

    public record VersionedConfiguration(JsonNode settings, long revision, Instant updatedAt, String updatedBy) { }
}
