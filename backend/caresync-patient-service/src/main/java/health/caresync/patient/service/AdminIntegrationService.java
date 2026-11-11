package health.caresync.patient.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class AdminIntegrationService {
    private final JdbcTemplate jdbcTemplate;
    private final ObjectProvider<FirebaseAuth> firebaseAuthProvider;

    public AdminIntegrationService(
        JdbcTemplate jdbcTemplate,
        ObjectProvider<FirebaseAuth> firebaseAuthProvider
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.firebaseAuthProvider = firebaseAuthProvider;
    }

    public List<IntegrationStatus> getStatuses() {
        return List.of(checkDatabase(), checkFirebase());
    }

    public IntegrationStatus test(String id) {
        return switch (id.toLowerCase(Locale.ROOT)) {
            case "database" -> checkDatabase();
            case "firebase" -> checkFirebase();
            default -> throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Integration is not supported");
        };
    }

    private IntegrationStatus checkDatabase() {
        Instant checkedAt = Instant.now();
        long start = System.nanoTime();
        try {
            Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            if (!Integer.valueOf(1).equals(result)) {
                return status("database", "Application database", "DATABASE", "Supabase",
                    "DISCONNECTED", checkedAt, elapsedMillis(start));
            }
            return status("database", "Application database", "DATABASE", "Supabase",
                "CONNECTED", checkedAt, elapsedMillis(start));
        } catch (DataAccessException exception) {
            return status("database", "Application database", "DATABASE", "Supabase",
                "DISCONNECTED", checkedAt, elapsedMillis(start));
        }
    }

    private IntegrationStatus checkFirebase() {
        Instant checkedAt = Instant.now();
        long start = System.nanoTime();
        FirebaseAuth auth = firebaseAuthProvider.getIfAvailable();
        if (auth == null) {
            return status("firebase", "Firebase Authentication", "AUTH", "Firebase",
                "UNKNOWN", checkedAt, null);
        }
        try {
            auth.listUsers(null, 1);
            return status("firebase", "Firebase Authentication", "AUTH", "Firebase",
                "CONNECTED", checkedAt, elapsedMillis(start));
        } catch (FirebaseAuthException | IllegalArgumentException exception) {
            return status("firebase", "Firebase Authentication", "AUTH", "Firebase",
                "DISCONNECTED", checkedAt, elapsedMillis(start));
        }
    }

    private static IntegrationStatus status(
        String id,
        String name,
        String category,
        String provider,
        String state,
        Instant checkedAt,
        Long latencyMs
    ) {
        return new IntegrationStatus(
            id, name, "Live connectivity check for the configured " + name + " service.",
            category, state, provider, null, null, null, checkedAt, latencyMs, null
        );
    }

    private static long elapsedMillis(long start) {
        return Duration.ofNanos(System.nanoTime() - start).toMillis();
    }

    public record IntegrationStatus(
        String id,
        String name,
        String description,
        String category,
        String status,
        String provider,
        String version,
        String region,
        String endpoint,
        Instant lastChecked,
        Long latencyMs,
        String docsUrl
    ) { }
}
