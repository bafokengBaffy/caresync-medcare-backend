package health.caresync.gateway.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(name = "caresync.firebase.enabled", havingValue = "true")
public class GatewayFirebaseConfig {
    @Bean
    FirebaseApp firebaseApp() throws IOException {
        if (!FirebaseApp.getApps().isEmpty()) {
            return FirebaseApp.getInstance();
        }
        String privateKey = System.getenv("FIREBASE_PRIVATE_KEY");
        String clientEmail = System.getenv("FIREBASE_CLIENT_EMAIL");
        GoogleCredentials credentials;
        if (hasText(privateKey) || hasText(clientEmail)) {
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

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static void addIfPresent(Map<String, String> values, String key, String value) {
        if (hasText(value)) {
            values.put(key, value);
        }
    }
}
