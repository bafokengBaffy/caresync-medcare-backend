package health.caresync.common.web;
public record ApiResponse<T>(T data, Object meta, Object errors) {
    public static <T> ApiResponse<T> ok(T data) { return new ApiResponse<>(data, null, null); }
}