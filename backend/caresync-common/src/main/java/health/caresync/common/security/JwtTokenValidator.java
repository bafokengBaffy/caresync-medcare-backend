package health.caresync.common.security;

import org.springframework.stereotype.Component;

import java.util.Map;

/** Pluggable JWT validator. Default returns empty map — real impl comes from the auth module. */
@Component
public class JwtTokenValidator {

    /** @return claims if token is valid, or null if invalid. */
    public Map<String, Object> validate(String token) {
        return null;
    }
}