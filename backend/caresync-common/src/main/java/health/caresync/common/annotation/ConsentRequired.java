package health.caresync.common.annotation;

import java.lang.annotation.*;

/** Requires the caller to have granted consent for the referenced patient. */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface ConsentRequired {
    /** SpEL expression resolving to the patient id, e.g. "#request.patientId". */
    String patientIdExpression() default "";
    String[] consentTypes() default {};
}