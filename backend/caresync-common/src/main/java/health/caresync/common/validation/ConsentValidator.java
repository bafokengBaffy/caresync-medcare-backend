package health.caresync.common.validation;

import health.caresync.common.exception.ValidationException;

public class ConsentValidator {

    public void validateTypes(String[] types) {
        if (types == null || types.length == 0) {
            throw new ValidationException("at least one consent type required");
        }
    }
}