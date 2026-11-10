package health.caresync.common.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to mark methods that require an audit trail entry.
 * OWASP Alignment: Enables automated tracking of sensitive actions (e.g., viewing PHI,
 * creating invoices) to satisfy HIPAA/GDPR logging requirements.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface AuditLog {
    /**
     * The action being performed (e.g., "READ_PATIENT", "UPDATE_INVOICE").
     */
    String action() default "UNKNOWN_ACTION";
    
    /**
     * Description of what the action does.
     */
    String description() default "";
}
