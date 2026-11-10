package health.caresync.common.config;

import com.google.auth.oauth2.ServiceAccountCredentials;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.security.KeyPairGenerator;
import java.util.Base64;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;

class FirebaseCredentialsLoaderTest {
    @Test
    void loadsCredentialsFromEnvironmentVariables() throws Exception {
        var keyPairGenerator = KeyPairGenerator.getInstance("RSA");
        keyPairGenerator.initialize(2048);
        byte[] keyBytes = keyPairGenerator.generateKeyPair().getPrivate().getEncoded();
        String privateKey = "-----BEGIN PRIVATE KEY-----\n"
                + Base64.getMimeEncoder(64, new byte[]{'\n'}).encodeToString(keyBytes)
                + "\n-----END PRIVATE KEY-----\n";
        Map<String, String> environment = Map.of(
                "FIREBASE_PROJECT_ID", "caresync-test",
                "FIREBASE_PRIVATE_KEY_ID", "test-key-id",
                "FIREBASE_CLIENT_EMAIL", "firebase-admin@caresync-test.iam.gserviceaccount.com",
                "FIREBASE_CLIENT_ID", "123456789",
                "FIREBASE_PRIVATE_KEY", privateKey);

        var credentials = FirebaseCredentialsLoader.load(
                new ClassPathResource("missing-firebase-service-account.json"), environment);

        assertInstanceOf(ServiceAccountCredentials.class, credentials);
    }

    @Test
    void rejectsIncompleteEnvironmentCredentials() {
        Map<String, String> environment = Map.of("FIREBASE_CLIENT_EMAIL", "firebase-admin@example.com");

        assertThrows(IllegalStateException.class, () -> FirebaseCredentialsLoader.load(
                new ClassPathResource("missing-firebase-service-account.json"), environment));
    }
}
