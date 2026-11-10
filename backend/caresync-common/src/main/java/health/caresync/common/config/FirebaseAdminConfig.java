package health.caresync.common.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import java.io.IOException;

/**
 * Shared Firebase Admin SDK configuration for downstream microservices.
 * OWASP Alignment: Centralizes secure credential loading. Prevents multiple
 * instances from attempting to initialize the SDK, which can cause race conditions.
 */
@Configuration
@ConditionalOnProperty(name = "caresync.firebase.enabled", havingValue = "true", matchIfMissing = true)
public class FirebaseAdminConfig {

    private static final Logger log = LoggerFactory.getLogger(FirebaseAdminConfig.class);

    @Bean
    @ConditionalOnMissingBean(FirebaseApp.class)
    public FirebaseApp firebaseApp(
            @Value("${firebase.service-account-path:classpath:firebase-service-account.json}")
            Resource serviceAccountResource) throws IOException {
        if (!FirebaseApp.getApps().isEmpty()) {
            return FirebaseApp.getInstance();
        }

        GoogleCredentials credentials = FirebaseCredentialsLoader.load(
                serviceAccountResource, System.getenv());
        FirebaseOptions.Builder options = FirebaseOptions.builder().setCredentials(credentials);
        String projectId = System.getenv("FIREBASE_PROJECT_ID");
        if (projectId != null && !projectId.isBlank()) {
            options.setProjectId(projectId);
        }

        try {
            FirebaseApp app = FirebaseApp.initializeApp(options.build());
            log.info("Firebase Admin SDK initialized in common module.");
            return app;
        } catch (RuntimeException e) {
            log.error("Failed to initialize Firebase Admin SDK; verify its configured credentials.", e);
            throw e;
        }
    }
}
