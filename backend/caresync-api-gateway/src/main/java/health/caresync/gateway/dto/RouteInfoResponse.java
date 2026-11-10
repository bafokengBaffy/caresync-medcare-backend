package health.caresync.gateway.dto;

import java.time.Instant;
import java.util.Objects;

/**
 * Safe metadata describing a configured gateway route.
 *
 * <p>Upstream addresses and credentials are intentionally excluded from this
 * response so route information can be logged or displayed without disclosing
 * internal network details.</p>
 */
public record RouteInfoResponse(
    String routeId,
    String path,
    String serviceName,
    boolean enabled,
    Instant updatedAt
) {
    public RouteInfoResponse {
        routeId = requireText(routeId, "routeId");
        path = requireText(path, "path");
        serviceName = requireText(serviceName, "serviceName");
        Objects.requireNonNull(updatedAt, "updatedAt is required");

        if (!path.startsWith("/")) {
            throw new IllegalArgumentException("path must be an absolute route path");
        }
    }

    private static String requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " must not be blank");
        }
        if (value.chars().anyMatch(Character::isISOControl)) {
            throw new IllegalArgumentException(field + " must not contain control characters");
        }
        return value;
    }
}