package health.caresync.common.config;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;

@Configuration
@ConditionalOnProperty(name = "caresync.firebase.enabled", havingValue = "true")
public class FirebaseAdminConfig {
    @Bean
    public FirebaseApp firebaseApp() throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {
            String credentialsPath = firstNonBlank(
                System.getenv("FIREBASE_CREDENTIALS_PATH"),
                System.getenv("GOOGLE_APPLICATION_CREDENTIALS")
            );
            String privateKey = System.getenv("FIREBASE_PRIVATE_KEY");
            String clientEmail = System.getenv("FIREBASE_CLIENT_EMAIL");
            GoogleCredentials credentials;
            if (hasText(credentialsPath)) {
                try (var input = Files.newInputStream(Path.of(credentialsPath))) {
                    credentials = GoogleCredentials.fromStream(input);
                }
            } else if (hasText(privateKey) || hasText(clientEmail)) {
                if (!hasText(privateKey) || !hasText(clientEmail)) {
                    throw new IllegalStateException(
                        "FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL must both be configured"
                    );
                }

                Map<String, String> credentialsJson = new LinkedHashMap<>();
                credentialsJson.put("type", "service_account");
                addIfPresent(credentialsJson, "project_id", System.getenv("FIREBASE_PROJECT_ID"));
                addIfPresent(credentialsJson, "private_key_id", System.getenv("FIREBASE_PRIVATE_KEY_ID"));
                credentialsJson.put("private_key", privateKey.replace("\\n", "\n"));
                credentialsJson.put("client_email", clientEmail);
                addIfPresent(credentialsJson, "client_id", System.getenv("FIREBASE_CLIENT_ID"));
                credentialsJson.put("auth_uri", "https://accounts.google.com/o/oauth2/auth");
                credentialsJson.put("token_uri", "https://oauth2.googleapis.com/token");
                credentials = GoogleCredentials.fromStream(new ByteArrayInputStream(
                    new ObjectMapper().writeValueAsBytes(credentialsJson)
                ));
            } else {
                credentials = GoogleCredentials.getApplicationDefault();
            }

            FirebaseOptions.Builder options = FirebaseOptions.builder().setCredentials(credentials);
            String projectId = System.getenv("FIREBASE_PROJECT_ID");
            if (hasText(projectId)) {
                options.setProjectId(projectId);
            }
            return FirebaseApp.initializeApp(options.build());
        }
        return FirebaseApp.getInstance();
    }

    @Bean
    public FirebaseAuth firebaseAuth(FirebaseApp firebaseApp) {
        return FirebaseAuth.getInstance(firebaseApp);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static String firstNonBlank(String first, String second) {
        return hasText(first) ? first : second;
    }

    private static void addIfPresent(Map<String, String> values, String key, String value) {
        if (hasText(value)) {
            values.put(key, value);
        }
    }
}