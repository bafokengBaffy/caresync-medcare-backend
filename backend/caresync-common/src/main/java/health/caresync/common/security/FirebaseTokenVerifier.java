package health.caresync.common.security;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.FirebaseAuthException;

public interface FirebaseTokenVerifier {
    FirebaseToken verify(String token) throws FirebaseAuthException;
}