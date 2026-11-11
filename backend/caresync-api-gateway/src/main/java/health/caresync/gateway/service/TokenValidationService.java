package health.caresync.gateway.service;

import health.caresync.gateway.config.GatewayTokenVerifier;
import health.caresync.gateway.config.VerifiedIdentity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.Duration;

/**
 * Token validation for incoming gateway requests.
 *
 * <p>OWASP alignment:
 * <ul>
 *   <li>A02 – Cryptographic failures: signature/issuer/audience/expiry all enforced.</li>
 *   <li>A04 – Insecure design: bounded timeouts, no retries, fail-closed.</li>
 *   <li>A07 – Auth failures: uniform rejection; no token contents logged.</li>
 *   <li>A09 – Logging: rejection reason codes only, never token values.</li>
 * </ul>
 */
@Service
public class TokenValidationService {

    private static final Logger log = LoggerFactory.getLogger(TokenValidationService.class);

    /** Hard cap on validation time to prevent resource exhaustion (A04). */
    private static final Duration VALIDATION_TIMEOUT = Duration.ofSeconds(5);

    private final GatewayTokenVerifier verifier;
    private final int maxTokenLength;

    @Autowired
    public TokenValidationService(
        GatewayTokenVerifier verifier,
        @Value("${caresync.gateway.security.max-token-length:8192}") int maxTokenLength
    ) {
        if (maxTokenLength < 1) {
            throw new IllegalArgumentException("Maximum token length must be positive");
        }
        this.verifier = verifier;
        this.maxTokenLength = maxTokenLength;
    }

    public TokenValidationService(GatewayTokenVerifier verifier) {
        this(verifier, 8192);
    }

    /**
     * Validate a bearer token and return the verified identity.
     *
     * <p>Failure modes are mapped uniformly to {@link TokenInvalidException}
     * so callers cannot distinguish signature vs expiry vs audience
     * (avoids oracle attacks, A02/A07).
     */
    public Mono<VerifiedIdentity> validate(String bearerToken) {
        String token = normalizeBearer(bearerToken);
        if (token == null) {
            return Mono.error(new TokenInvalidException("missing_token"));
        }

        // Reject oversized tokens early (A03/A04).
        if (token.length() > maxTokenLength) {
            log.warn("token_rejected reason=oversized");
            return Mono.error(new TokenInvalidException("invalid_token"));
        }

        return Mono.fromCallable(() -> verifier.verify(token))
                .subscribeOn(Schedulers.boundedElastic())
                .timeout(VALIDATION_TIMEOUT)
                .switchIfEmpty(Mono.error(new TokenInvalidException("invalid_token")))
                .onErrorMap(t -> {
                    // Normalize EVERY failure to a single error type to avoid oracles.
                    if (t instanceof TokenInvalidException) {
                        return t;
                    }
                    log.warn("token_rejected reason={}", classify(t));
                    return new TokenInvalidException("invalid_token");
                });
    }

    /** Strip "Bearer " prefix case-insensitively; reject malformed schemes. */
    private String normalizeBearer(String header) {
        if (header == null) return null;
        String trimmed = header.trim();
        if (trimmed.length() < 8) return null;
        String prefix = trimmed.substring(0, 7);
        if (!prefix.equalsIgnoreCase("bearer ")) return null;
        String token = trimmed.substring(7).trim();
        return token.isEmpty() ? null : token;
    }

    /** Classification only for logs; never returned to clients (A02/A07/A09). */
    private String classify(Throwable t) {
        if (t instanceof java.util.concurrent.TimeoutException) return "timeout";
        return "verification_failed";
    }

    /** Uniform error type – does not reveal failure cause. */
    public static class TokenInvalidException extends RuntimeException {
        private final String internalCode;
        public TokenInvalidException(String internalCode) {
            super("Invalid or expired token"); // safe message
            this.internalCode = internalCode;
        }
        public String getInternalCode() {
            return internalCode;
        }
    }
}