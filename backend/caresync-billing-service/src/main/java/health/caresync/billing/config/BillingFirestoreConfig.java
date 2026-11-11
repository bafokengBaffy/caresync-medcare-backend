package health.caresync.billing.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.io.IOException;

/**
 * Firestore configuration for the Billing service.
 *
 * OWASP notes:
 * - Credentials are loaded from the ambient environment (ADC / GOOGLE_APPLICATION_CREDENTIALS),
 *   NEVER hardcoded. A02:2021 Cryptographic Failures.
 * - Firestore client is created once and reused (thread-safe).
 * - Only activated on profiles that need Firestore (prod, gcp).
 */
@Configuration
@Profile({"prod", "gcp", "firestore"})
public class BillingFirestoreConfig {

    @Value("${caresync.firestore.project-id}")
    private String projectId;

    @Value("${caresync.firestore.database-id:(default)}")
    private String databaseId;

    @Bean(destroyMethod = "close")
    public Firestore billingFirestore() throws IOException {
        GoogleCredentials credentials = GoogleCredentials.getApplicationDefault();

        FirestoreOptions options = FirestoreOptions.newBuilder()
                .setProjectId(projectId)
                .setDatabaseId(databaseId)
                .setCredentials(credentials)
                .build();

        return options.getService();
    }
}