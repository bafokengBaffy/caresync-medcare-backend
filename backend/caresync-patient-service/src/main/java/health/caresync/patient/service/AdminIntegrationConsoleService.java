package health.caresync.patient.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

/** Super-admin integration inventory. It returns environment-variable names and presence only. */
@Service
public class AdminIntegrationConsoleService {
    private final JdbcTemplate jdbc;
    private final ObjectProvider<FirebaseAuth> firebase;
    private final ObjectMapper mapper;

    public AdminIntegrationConsoleService(JdbcTemplate jdbc, ObjectProvider<FirebaseAuth> firebase, ObjectMapper mapper) {
        this.jdbc = jdbc;
        this.firebase = firebase;
        this.mapper = mapper;
    }

    public List<IntegrationDescriptor> list(String search, String category, String environment) {
        String q = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        return descriptors().stream()
            .filter(item -> q.isEmpty() || (item.name() + " " + item.category()).toLowerCase(Locale.ROOT).contains(q))
            .filter(item -> category == null || category.isBlank() || category.equalsIgnoreCase("all") || item.category().equalsIgnoreCase(category))
            .filter(item -> environment == null || environment.isBlank() || environment.equalsIgnoreCase("all") || item.environments().contains(environment.toLowerCase(Locale.ROOT)))
            .toList();
    }

    public List<StatusReport> statuses(String ids) {
        List<String> selected = ids == null || ids.isBlank()
            ? List.of("database", "firebase") : List.of(ids.split(","));
        return selected.stream().map(String::trim).filter(id -> !id.isBlank()).map(this::status).toList();
    }

    public StatusReport status(String id) {
        IntegrationDescriptor descriptor = descriptor(id);
        List<Probe> probes = new ArrayList<>();
        if (id.equals("database")) probes.add(probeDatabase());
        else if (id.equals("firebase")) probes.add(probeFirebase());
        String status = probes.isEmpty() ? "unknown" : probes.get(0).ok() ? "healthy" : "unavailable";
        return new StatusReport(id, status, probes.isEmpty() ? null : probes.get(0).checkedAt(), probes);
    }

    public List<Readiness> readiness(String id) {
        IntegrationDescriptor descriptor = descriptor(id);
        int total = (int) descriptor.credentialFields().stream().filter(CredentialField::required).count();
        int present = (int) descriptor.credentialFields().stream().filter(field -> field.required() && field.presence().equals("present")).count();
        List<String> missing = descriptor.credentialFields().stream().filter(field -> field.required() && field.presence().equals("missing")).map(CredentialField::key).toList();
        return List.of(new Readiness(currentEnvironment(), present == total, total, present, missing, Instant.now()));
    }

    public List<IntegrationEvent> events(String id) {
        descriptor(id);
        return jdbc.query("""
            SELECT id, service_id, action, actor_id, actor_name, description, occurred_at
            FROM admin_integration_events WHERE service_id = ? ORDER BY occurred_at DESC LIMIT 50
            """, (rs, row) -> new IntegrationEvent(rs.getObject("id").toString(), rs.getString("service_id"),
                rs.getString("action"), rs.getString("description"), rs.getString("actor_id"),
                rs.getString("actor_name"), rs.getTimestamp("occurred_at").toInstant()), id);
    }

    public StatusReport probe(String id, String checkId, String reason, String actorId, String actorName) {
        descriptor(id);
        if (reason == null || reason.trim().length() < 3 || reason.length() > 500) throw bad("A reason between 3 and 500 characters is required");
        Probe result = switch (id + ":" + checkId) {
            case "database:database-read" -> probeDatabase();
            case "firebase:firebase-read" -> probeFirebase();
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Probe is not allowlisted");
        };
        saveEvent(id, "PROBE", actorId, actorName, "Ran allowlisted integration health check", Map.of("checkId", checkId, "reason", reason.trim()));
        return status(id);
    }

    public StatusReport rotation(String id, String environment, List<String> keys, String reason, String ticket, String actorId, String actorName) {
        IntegrationDescriptor item = descriptor(id);
        if (!item.environments().contains(environment) || keys == null || keys.isEmpty() || reason == null || reason.trim().length() < 3 || reason.length() > 500)
            throw bad("A supported environment, rotated key, and reason are required");
        List<String> allowed = item.credentialFields().stream().map(CredentialField::key).toList();
        if (keys.size() > 20 || keys.stream().anyMatch(key -> !allowed.contains(key))) throw bad("Credential field is not allowlisted");
        if (ticket != null && !ticket.isBlank() && !ticket.matches("[A-Z][A-Z0-9-]{1,30}")) throw bad("Ticket reference format is invalid");
        saveEvent(id, "ROTATION_RECORDED", actorId, actorName, "Credential rotation recorded", Map.of("environment", environment, "keys", keys, "reason", reason.trim(), "ticket", ticket == null ? "" : ticket));
        return status(id);
    }

    public Readiness verify(String id, String environment, String reason, String actorId, String actorName) {
        descriptor(id);
        if (!currentEnvironment().equals(environment) || reason == null || reason.trim().length() < 3 || reason.length() > 500) throw bad("Environment or reason is invalid");
        saveEvent(id, "ENVIRONMENT_VERIFIED", actorId, actorName, "Credential presence rechecked", Map.of("environment", environment, "reason", reason.trim()));
        return readiness(id).get(0);
    }

    private List<IntegrationDescriptor> descriptors() { return List.of(descriptor("database"), descriptor("firebase")); }

    private IntegrationDescriptor descriptor(String id) {
        String env = currentEnvironment();
        return switch (id) {
            case "database" -> new IntegrationDescriptor(id, "Application PostgreSQL", "Live application database connection and credential presence.", "database", List.of(env),
                List.of(field("SPRING_DATASOURCE_URL", "Database URL", true), field("SPRING_DATASOURCE_USERNAME", "Database username", true), field("SPRING_DATASOURCE_PASSWORD", "Database password", true)),
                List.of(new HealthCheck("database-read", "Database connectivity", "GET", "SELECT 1", 200)), List.of(), null, null);
            case "firebase" -> new IntegrationDescriptor(id, "Firebase Authentication", "Firebase Admin SDK connectivity and service-account configuration.", "identity", List.of(env),
                List.of(field("FIREBASE_PROJECT_ID", "Firebase project", true),
                    field("FIREBASE_CLIENT_EMAIL", "Firebase service account email", true),
                    field("FIREBASE_PRIVATE_KEY", "Firebase service account key", true),
                    field("FIREBASE_SERVICE_ACCOUNT_PATH", "Firebase service account file", false)),
                List.of(new HealthCheck("firebase-read", "Firebase Auth connectivity", "GET", "Firebase Admin list users", 200)), List.of(), "https://firebase.google.com/docs/admin/setup", "https://console.firebase.google.com/");
            default -> throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Integration is not supported");
        };
    }

    private CredentialField field(String key, String label, boolean required) {
        boolean present = switch (key) {
            case "SPRING_DATASOURCE_URL" -> hasAny("SPRING_DATASOURCE_URL", "DB_URL", "SUPABASE_DB_URL");
            case "SPRING_DATASOURCE_USERNAME" -> hasAny("SPRING_DATASOURCE_USERNAME", "DB_USER", "SUPABASE_DB_USER");
            case "SPRING_DATASOURCE_PASSWORD" -> hasAny("SPRING_DATASOURCE_PASSWORD", "DB_PASSWORD", "SUPABASE_DB_PASSWORD");
            case "FIREBASE_SERVICE_ACCOUNT_PATH" -> hasAny("FIREBASE_SERVICE_ACCOUNT_PATH");
            case "FIREBASE_SERVICE_ACCOUNT_JSON" -> hasAny("FIREBASE_SERVICE_ACCOUNT_JSON", "GOOGLE_APPLICATION_CREDENTIALS");
            case "FIREBASE_PROJECT_ID" -> hasAny("FIREBASE_PROJECT_ID");
            case "FIREBASE_CLIENT_EMAIL" -> hasAny("FIREBASE_CLIENT_EMAIL");
            case "FIREBASE_PRIVATE_KEY" -> hasAny("FIREBASE_PRIVATE_KEY");
            default -> false;
        };
        return new CredentialField(key, label, required, present ? "present" : required ? "missing" : "not_required");
    }

    private Probe probeDatabase() {
        Instant now = Instant.now(); long start = System.nanoTime();
        try { Integer n = jdbc.queryForObject("SELECT 1", Integer.class); return new Probe("database-read", Integer.valueOf(1).equals(n), 200, elapsed(start), now, null); }
        catch (DataAccessException exception) { return new Probe("database-read", false, null, elapsed(start), now, "Database health check failed"); }
    }
    private Probe probeFirebase() {
        Instant now = Instant.now(); long start = System.nanoTime(); FirebaseAuth auth = firebase.getIfAvailable();
        if (auth == null) return new Probe("firebase-read", false, null, elapsed(start), now, "Firebase Admin is not configured");
        try { auth.listUsers(null, 1); return new Probe("firebase-read", true, 200, elapsed(start), now, null); }
        catch (FirebaseAuthException | IllegalArgumentException exception) { return new Probe("firebase-read", false, null, elapsed(start), now, "Firebase health check failed"); }
    }
    private void saveEvent(String id, String action, String actorId, String actorName, String description, Map<String, ?> metadata) {
        try { jdbc.update("INSERT INTO admin_integration_events(service_id,action,actor_id,actor_name,description,metadata) VALUES(?,?,?,?,?,?::jsonb)", id, action, safe(actorId, 128), safe(actorName, 320), description, mapper.writeValueAsString(metadata)); }
        catch (JsonProcessingException exception) { throw new IllegalStateException("Could not record integration event", exception); }
    }
    private static String currentEnvironment() { String env = System.getenv().getOrDefault("APP_ENVIRONMENT", "production").toLowerCase(Locale.ROOT); return List.of("development", "staging", "production").contains(env) ? env : "production"; }
    private static boolean hasAny(String... names) { for (String name : names) { String v = System.getenv(name); if (v != null && !v.isBlank()) return true; } return false; }
    private static long elapsed(long start) { return Duration.ofNanos(System.nanoTime() - start).toMillis(); }
    private static String safe(String value, int max) { return value == null ? "" : value.replaceAll("[\\p{Cntrl}]", "").trim().substring(0, Math.min(value.replaceAll("[\\p{Cntrl}]", "").trim().length(), max)); }
    private static ResponseStatusException bad(String message) { return new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }

    public record CredentialField(String key, String label, boolean required, String presence) { }
    public record HealthCheck(String id, String name, String method, String endpoint, int expectStatus) { }
    public record IntegrationDescriptor(String id, String name, String description, String category, List<String> environments, List<CredentialField> credentialFields, List<HealthCheck> healthChecks, List<String> notes, String docsUrl, String dashboardUrl) { }
    public record Probe(String checkId, boolean ok, Integer statusCode, long latencyMs, Instant checkedAt, String message) { }
    public record StatusReport(String serviceId, String status, Instant lastCheckedAt, List<Probe> probes) { }
    public record Readiness(String environment, boolean ready, int requiredTotal, int requiredPresent, List<String> missingKeys, Instant updatedAt) { }
    public record IntegrationEvent(String id, String serviceId, String action, String description, String actorId, String actorName, Instant occurredAt) { }
}
