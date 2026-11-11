package health.caresync.common.security;

import org.springframework.stereotype.Component;

/** Interface-shape consent verifier — override in a module with a real repository. */
@Component
public class ConsentVerifier {

    /** Default: deny (fail closed — OWASP A01). Modules must override or provide a real impl. */
    public boolean isGranted(String patientId, String[] consentTypes) {
        return false;
    }
}