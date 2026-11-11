package health.caresync.common.util;

import health.caresync.common.constants.ApiConstants;

public final class PaginationUtils {
    private PaginationUtils() {}
    public static int sanitizePage(Integer page) {
        return (page == null || page < 0) ? 0 : page;
    }
    public static int sanitizeSize(Integer size) {
        if (size == null || size < 1) return 20;
        return Math.min(size, ApiConstants.MAX_PAGE_SIZE);
    }
}