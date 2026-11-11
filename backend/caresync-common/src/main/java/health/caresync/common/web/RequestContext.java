package health.caresync.common.web;

import health.caresync.common.security.TenantContext;

/** Convenience accessor for the current request's tenant + actor. */
public final class RequestContext {
    private RequestContext() {}
    public static String tenantId() { return TenantContext.getTenantId(); }
    public static String actorId(String principalHeader) { return principalHeader; }
}