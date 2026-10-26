package health.caresync.common.exception;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiError> notFound(NotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError("NOT_FOUND", e.getMessage(), null, null, Instant.now()));
    }
    @ExceptionHandler({ForbiddenException.class, TenantMismatchException.class})
    public ResponseEntity<ApiError> forbidden(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiError("FORBIDDEN", e.getMessage(), null, null, Instant.now()));
    }
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ApiError> invalid(ValidationException e) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(new ApiError("VALIDATION_ERROR", e.getMessage(), null, null, Instant.now()));
    }
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> conflict(DataIntegrityViolationException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(new ApiError("CONFLICT", "The requested change conflicts with existing data", null, null, Instant.now()));
    }
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> generic(Exception e) {
        LOGGER.error("Unhandled API error", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiError("INTERNAL_ERROR", "Unexpected error", null, null, Instant.now()));
    }
}