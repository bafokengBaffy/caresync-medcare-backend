package health.caresync.common.validation;

import health.caresync.common.exception.ValidationException;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Component
public class TenantIdValidator {

    private static final Pattern TENANT = Pattern.compile("^[A-Za-z0-9_\\-]{1,64}$");

    public void validate(String tenantId) {
        if (tenantId == null || !TENANT.matcher(tenantId).matches()) {
            throw new ValidationException("invalid tenant id");
        }
    }
}