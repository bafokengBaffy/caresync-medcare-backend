package health.caresync.gateway.config;

import com.google.firebase.auth.FirebaseAuthException;

public interface GatewayTokenVerifier {
    VerifiedIdentity verify(String token) throws FirebaseAuthException;
}
