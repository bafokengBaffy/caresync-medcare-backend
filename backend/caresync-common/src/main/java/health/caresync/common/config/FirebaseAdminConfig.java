package health.caresync.common.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.io.InputStream;

/**
 * Shared Firebase Admin SDK configuration for downstream microservices.
 * OWASP Alignment: Centralizes secure credential loading. Prevents multiple
 * instances from attempting to initialize the SDK, which can cause race conditions.
 */
@Configuration
public class FirebaseAdminConfig {

    private static final Logger log = LoggerFactory.getLogger(FirebaseAdminConfig.class);

    @Value("${firebase.service-account-path:classpath:firebase-service-account.json}")
    private Resource serviceAccountResource;

    @Bean
    @ConditionalOnMissingBean(FirebaseApp.class)
    public FirebaseApp firebaseApp() throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {
            try (InputStream serviceAccount = serviceAccountResource.getInputStream()) {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                        .build();
                FirebaseApp app = FirebaseApp.initializeApp(options);
                log.info("Firebase Admin SDK initialized in common module.");
                return app;
            } catch (IOException e) {
                log.error("CRITICAL: Failed to load Firebase credentials. Ensure the service account file exists.", e);
                throw new IOException("Failed to initialize Firebase", e);
            }
        }
        return FirebaseApp.getInstance();
    }
}
