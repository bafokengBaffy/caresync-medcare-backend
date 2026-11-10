package health.caresync.gateway.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.io.InputStream;

/**
 * Firebase Admin SDK configuration for the API Gateway.
 * <p>
 * Loads the Firebase service account credentials from a secure classpath resource
 * (typically provided via environment variable or mounted secret in production)
 * and initializes a single {@link FirebaseApp} instance.
 * <p>
 * OWASP Alignment:
 * - Credentials are never hardcoded; they are loaded from a resource that
 *   should be injected via a secrets manager (e.g., Azure Key Vault, Render Env Vars).
 * - Fails fast if the credentials cannot be loaded, preventing the application
 *   from starting in an insecure or non-functional state.
 */
@Configuration
public class FirebaseGatewayConfig {

    private static final Logger log = LoggerFactory.getLogger(FirebaseGatewayConfig.class);

    @Value("${firebase.service-account-path:classpath:firebase-service-account.json}")
    private Resource serviceAccountResource;

    @Value("${firebase.project-id:}")
    private String projectId;

    /**
     * Initializes the FirebaseApp bean if it hasn't been initialized already.
     * 
     * @return FirebaseAuth instance for token verification.
     * @throws IOException if the service account file cannot be read.
     */
    @Bean
    public FirebaseAuth firebaseAuth() throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {
            try (InputStream serviceAccount = serviceAccountResource.getInputStream()) {
                FirebaseOptions.Builder optionsBuilder = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount));

                // Optionally override project ID if specified in application properties
                if (projectId != null && !projectId.isBlank()) {
                    optionsBuilder.setProjectId(projectId);
                }

                FirebaseApp.initializeApp(optionsBuilder.build());
                log.info("Firebase Admin SDK initialized successfully.");
            } catch (IOException e) {
                log.error("CRITICAL: Failed to load Firebase service account credentials. " +
                        "Ensure 'firebase.service-account-path' is correctly configured and the file is accessible.", e);
                throw new IOException("Failed to initialize Firebase Admin SDK", e);
            }
        } else {
            log.info("Firebase Admin SDK already initialized.");
        }
        return FirebaseAuth.getInstance();
    }
}