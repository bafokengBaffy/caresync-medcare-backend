package health.caresync.common.web;

import health.caresync.common.constants.ErrorConstants;
import health.caresync.common.dto.ErrorDetail;

import java.util.List;

/** Builds safe error payloads (no stack traces — OWASP A05). */
public final class ApiErrorBuilder {
    private ApiErrorBuilder() {}
    public static String internalError() { return ErrorConstants.INTERNAL; }
    public static String validationFailed() { return ErrorConstants.VALIDATION_FAILED; }
    public static List<ErrorDetail> of(ErrorDetail... details) { return List.of(details); }
}