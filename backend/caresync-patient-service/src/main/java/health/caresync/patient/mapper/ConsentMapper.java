package health.caresync.patient.mapper;

import health.caresync.patient.domain.entity.Consent;
import health.caresync.patient.domain.entity.ConsentHistory;
import health.caresync.patient.dto.ConsentHistoryResponse;
import health.caresync.patient.dto.ConsentResponse;
import org.springframework.stereotype.Component;

@Component
public class ConsentMapper {
    public ConsentResponse toResponse(Consent consent) {
        return new ConsentResponse(
            consent.getId(),
            consent.getPatientId(),
            consent.getConsentType(),
            consent.getStatus().name(),
            consent.getPurpose(),
            consent.getGrantedAt(),
            consent.getExpiresAt(),
            consent.getRevokedAt(),
            consent.getRevocationReason(),
            consent.getCreatedBy(),
            consent.getUpdatedBy(),
            consent.getCreatedAt(),
            consent.getUpdatedAt()
        );
    }

    public ConsentHistoryResponse toHistoryResponse(ConsentHistory history) {
        return new ConsentHistoryResponse(
            history.getId(),
            history.getAction(),
            history.getPreviousStatus(),
            history.getNewStatus(),
            history.getReason(),
            history.getActorUserId(),
            history.getCorrelationId(),
            history.getOccurredAt()
        );
    }
}