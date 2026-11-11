package health.caresync.common.dto;

import java.time.Instant;
import java.util.List;

public record ConsentResponse(
        String id, String tenantId, String patientId,
        List<String> consentTypes, String status, Instant grantedAt
) {}