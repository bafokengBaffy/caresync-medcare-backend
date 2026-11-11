package health.caresync.common.web;

import java.time.Instant;

public record ApiResponse<T>(boolean success, T data, String message, String error, Instant timestamp) {
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null, null, Instant.now());
    }

    public static <T> ApiResponse<T> fail(String error) {
        return new ApiResponse<>(false, null, null, error, Instant.now());
    }

    public static <T> ApiResponse<T> success(T data) {
        return ok(data);
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, data, message, null, Instant.now());
    }

    public static <T> ApiResponse<T> error(String error) {
        return fail(error);
    }
}