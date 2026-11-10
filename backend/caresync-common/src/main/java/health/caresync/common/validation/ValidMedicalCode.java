package health.caresync.common.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

/**
 * Custom annotation to validate Medical/Procedure codes.
 */
@Documented
@Constraint(validatedBy = MedicalCodeValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidMedicalCode {
    String message() default "Invalid medical code format.";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
