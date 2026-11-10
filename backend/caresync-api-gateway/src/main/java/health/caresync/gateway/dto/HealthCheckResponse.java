package health.caresync.gateway.dto;

import java.time.Instant;

/**
 * Data Transfer Object representing the health status of the API Gateway.
 * <p>
 * OWASP Alignment: Avoids leaking sensitive internal implementation details
 * (like database connection strings or internal IPs) to unauthenticated health check callers.
 */
public class HealthCheckResponse {

    private String status;
    private String service;
    private String version;
    private Instant timestamp;
    private long uptimeMillis;

    public HealthCheckResponse() {
    }

    public HealthCheckResponse(String status, String service, String version, Instant timestamp, long uptimeMillis) {
        this.status = status;
        this.service = service;
        this.version = version;
        this.timestamp = timestamp;
        this.uptimeMillis = uptimeMillis;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getService() {
        return service;
    }

    public void setService(String service) {
        this.service = service;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public long getUptimeMillis() {
        return uptimeMillis;
    }

    public void setUptimeMillis(long uptimeMillis) {
        this.uptimeMillis = uptimeMillis;
    }
}