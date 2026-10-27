package health.caresync.patient.domain.valueobject;

import java.util.regex.Pattern;

public record ConsentType(String value) {
    private static final Pattern VALID_TYPE = Pattern.compile("[A-Z][A-Z0-9_]{1,63}");

    public ConsentType {
        if (value == null || !VALID_TYPE.matcher(value).matches()) {
            throw new IllegalArgumentException("Consent type must be a valid uppercase identifier");
        }
    }
}