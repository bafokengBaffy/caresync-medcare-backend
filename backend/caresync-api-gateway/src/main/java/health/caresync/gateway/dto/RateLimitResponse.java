package health.caresync.gateway.dto;

import java.time.Instant;

/**
 * Data Transfer Object returned when a client exceeds the rate limit.
 * <p>
 * OWASP Alignment: Provides necessary context (retry after) without revealing
 * server internals. The message is generic to prevent information disclosure.
 */
public class RateLimitResponse {

    private final String error;
    private final String message;
    private final int status;
    private final Instant timestamp;
    private final String path;
    private final long retryAfterSeconds;

    public RateLimitResponse(String error, String message, int status, Instant timestamp, String path, long retryAfterSeconds) {
        this.error = error;
        this.message = message;
        this.status = status;
        this.timestamp = timestamp;
        this.path = path;
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public String getError() {
        return error;
    }

    public String getMessage() {
        return message;
    }

    public int getStatus() {
        return status;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public String getPath() {
        return path;
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}