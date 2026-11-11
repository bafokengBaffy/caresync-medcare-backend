package health.caresync.common.dto;

/** Safe error detail — no stack traces, no internals (OWASP A05). */
public record ErrorDetail(String field, String code, String message) {}