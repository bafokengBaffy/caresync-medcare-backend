package health.caresync.billing.dto;

import java.util.UUID;

public record ServiceFeeResponse(
    UUID id,
    String code,
    String description,
    long unitPriceCents,
    String currency,
    boolean active
) {
}
