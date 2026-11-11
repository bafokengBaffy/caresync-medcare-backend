package health.caresync.common.aspect;

import health.caresync.common.annotation.ConsentRequired;
import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.security.ConsentVerifier;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.lang.reflect.Parameter;

/** Enforces patient consent before executing annotated methods (OWASP A01). */
@Aspect
@Component
public class ConsentAspect {

    private static final Logger log = LoggerFactory.getLogger(ConsentAspect.class);
    private final ConsentVerifier consentVerifier;
    private final ExpressionParser parser = new SpelExpressionParser();

    public ConsentAspect(ConsentVerifier consentVerifier) {
        this.consentVerifier = consentVerifier;
    }

    @Around("@annotation(consentRequired)")
    public Object enforce(ProceedingJoinPoint pjp, ConsentRequired consentRequired) throws Throwable {
        String expr = consentRequired.patientIdExpression();
        if (expr == null || expr.isBlank()) {
            return pjp.proceed();
        }
        String patientId = resolveExpression(pjp, expr);
        if (patientId == null || patientId.isBlank()) {
            throw new ForbiddenException("Unable to resolve patientId for consent check");
        }
        boolean granted = consentVerifier.isGranted(patientId, consentRequired.consentTypes());
        if (!granted) {
            log.warn("Consent denied patient={} types={}", patientId,
                    String.join(",", consentRequired.consentTypes()));
            throw new ForbiddenException("Patient consent not granted");
        }
        return pjp.proceed();
    }

    private String resolveExpression(ProceedingJoinPoint pjp, String expr) {
        try {
            StandardEvaluationContext ctx = new StandardEvaluationContext();
            String[] names = ((Method) pjp.getSignature().getDeclaringType()
                    .getDeclaredMethods()[0]).getParameters()[0].getName().split(",");
            // Best-effort: bind parameters by reflection
            Method m = findMethod(pjp);
            if (m != null) {
                Parameter[] params = m.getParameters();
                Object[] args = pjp.getArgs();
                for (int i = 0; i < params.length && i < args.length; i++) {
                    ctx.setVariable(params[i].getName(), args[i]);
                    ctx.setVariable("p" + i, args[i]);
                    ctx.setVariable("a" + i, args[i]);
                }
                // Also expose a0 as #request for compatibility
                if (args.length > 0) ctx.setVariable("request", args[0]);
            }
            // Normalize "#request.patientId" -> "#request.patientId" via SpEL
            Object value = parser.parseExpression(expr).getValue(ctx);
            return value == null ? null : value.toString();
        } catch (Exception e) {
            log.warn("Consent expression resolution failed: {}", e.getMessage());
            return null;
        }
    }

    private Method findMethod(ProceedingJoinPoint pjp) {
        try {
            return pjp.getSignature().getDeclaringType()
                    .getDeclaredMethod(pjp.getSignature().getName());
        } catch (NoSuchMethodException e) {
            return null;
        }
    }
}