package health.caresync.common.dto;

import java.util.List;

public record PaginatedResponse<T>(List<T> items, PageMetadata page) {}