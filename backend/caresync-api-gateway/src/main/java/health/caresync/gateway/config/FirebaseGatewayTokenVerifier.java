package health.caresync.gateway.config;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import org.springframework.stereotype.Component;

@Component
public class FirebaseGatewayTokenVerifier implements GatewayTokenVerifier {
    @Override
    public VerifiedIdentity verify(String rawToken) throws FirebaseAuthException {
        FirebaseToken token = FirebaseAuth.getInstance().verifyIdToken(rawToken);
        Object tenant = token.getClaims().get("tenant_id");
        Object role = token.getClaims().get("role");
        Object specialty = token.getClaims().get("specialty");
        return new VerifiedIdentity(
            token.getUid(),
            tenant instanceof String value ? value : null,
            role instanceof String value ? value : null,
            specialty instanceof String value ? value : ""
        );
    }
}
