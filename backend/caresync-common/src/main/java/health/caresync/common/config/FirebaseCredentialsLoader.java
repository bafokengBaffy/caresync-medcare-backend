package health.caresync.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.auth.oauth2.GoogleCredentials;
import org.springframework.core.io.Resource;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;

final class FirebaseCredentialsLoader {
    private FirebaseCredentialsLoader() {
    }

    static GoogleCredentials load(Resource serviceAccountResource, Map<String, String> environment)
            throws IOException {
        String credentialsPath = firstNonBlank(
                environment.get("FIREBASE_CREDENTIALS_PATH"),
                environment.get("GOOGLE_APPLICATION_CREDENTIALS"));
        if (hasText(credentialsPath)) {
            try (var input = Files.newInputStream(Path.of(credentialsPath))) {
                return GoogleCredentials.fromStream(input);
            }
        }

        if (serviceAccountResource.exists()) {
            try (var input = serviceAccountResource.getInputStream()) {
                return GoogleCredentials.fromStream(input);
            }
        }

        String privateKey = environment.get("FIREBASE_PRIVATE_KEY");
        String clientEmail = environment.get("FIREBASE_CLIENT_EMAIL");
        if (hasText(privateKey) || hasText(clientEmail)) {
            if (!hasText(privateKey) || !hasText(clientEmail)) {
                throw new IllegalStateException(
                        "FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL must both be configured");
            }

            Map<String, String> credentialsJson = new LinkedHashMap<>();
            credentialsJson.put("type", "service_account");
            addIfPresent(credentialsJson, "project_id", environment.get("FIREBASE_PROJECT_ID"));
            addIfPresent(credentialsJson, "private_key_id", environment.get("FIREBASE_PRIVATE_KEY_ID"));
            credentialsJson.put("private_key", privateKey.replace("\\n", "\n"));
            credentialsJson.put("client_email", clientEmail);
            addIfPresent(credentialsJson, "client_id", environment.get("FIREBASE_CLIENT_ID"));
            credentialsJson.put("auth_uri", "https://accounts.google.com/o/oauth2/auth");
            credentialsJson.put("token_uri", "https://oauth2.googleapis.com/token");
            return GoogleCredentials.fromStream(new ByteArrayInputStream(
                    new ObjectMapper().writeValueAsBytes(credentialsJson)));
        }

        return GoogleCredentials.getApplicationDefault();
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
