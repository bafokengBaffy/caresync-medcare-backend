package health.caresync.common.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

/**
 * Custom annotation to validate National ID numbers.
 */
@Documented
@Constraint(validatedBy = IdNumberValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidIdNumber {
    String message() default "Invalid ID number format. Must be 12-13 digits.";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
