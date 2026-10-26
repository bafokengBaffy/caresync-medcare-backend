package health.caresync.common.exception;
import java.time.Instant;
public record ApiError(String code, String message, Object details, String requestId, Instant timestamp) { }