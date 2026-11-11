package health.caresync.common.aspect;

import health.caresync.common.annotation.ValidateTenant;
import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.security.TenantContext;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/** Ensures header tenant matches authenticated tenant (OWASP A01). */
@Aspect
@Component
public class TenantValidationAspect {

    @Around("@annotation(validateTenant)")
    public Object enforce(ProceedingJoinPoint pjp, ValidateTenant validateTenant) throws Throwable {
        var attrs = RequestContextHolder.getRequestAttributes();
        if (!(attrs instanceof ServletRequestAttributes sra)) return pjp.proceed();
        String headerTenant = sra.getRequest().getHeader(validateTenant.headerName());
        String ctxTenant = TenantContext.getTenantId();
        if (headerTenant != null && ctxTenant != null && !headerTenant.equals(ctxTenant)) {
            throw new ForbiddenException("Tenant mismatch between header and token");
        }
        return pjp.proceed();
    }
}