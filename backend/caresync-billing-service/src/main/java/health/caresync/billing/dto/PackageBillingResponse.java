package health.caresync.billing.dto;

import health.caresync.billing.domain.enums.DiscountType;
import health.caresync.billing.domain.enums.PaymentRoute;

import java.math.BigDecimal;
import java.time.Instant;

public record PackageBillingResponse(
        String id,
        String tenantId,
        String patientId,
        String packageCode,
        BigDecimal grossPrice,
        BigDecimal discountAmount,
        DiscountType discountType,
        BigDecimal netPrice,
        PaymentRoute paymentRoute,
        int totalSessions,
        int usedSessions,
        String status,
        Instant createdAt,
        Instant updatedAt
) {}