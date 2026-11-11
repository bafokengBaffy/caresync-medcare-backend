package health.caresync.patient.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
@ConditionalOnProperty(name = "caresync.firebase.enabled", havingValue = "true")
public class FirebaseVerificationService {
    private final FirebaseAuth firebaseAuth;
    private final EmailDeliveryService emailDeliveryService;

    public FirebaseVerificationService(FirebaseAuth firebaseAuth, EmailDeliveryService emailDeliveryService) {
        this.firebaseAuth = firebaseAuth;
        this.emailDeliveryService = emailDeliveryService;
    }

    public void sendVerificationEmail(String firebaseUid) {
        if (firebaseUid == null || firebaseUid.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Firebase UID is required");
        }
        try {
            UserRecord user = firebaseAuth.getUser(firebaseUid);
            if (user.getEmail() == null || user.getEmail().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Firebase user has no email address");
            }
            String verificationLink = firebaseAuth.generateEmailVerificationLink(user.getEmail());
            emailDeliveryService.sendVerificationEmail(user.getEmail(), verificationLink);
        } catch (FirebaseAuthException exception) {
            throw new IllegalStateException("Could not create Firebase verification link", exception);
        }
    }
}
