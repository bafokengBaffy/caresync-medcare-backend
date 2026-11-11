package health.caresync.common.dto;

public record PageMetadata(int page, int size, long totalElements, int totalPages) {}