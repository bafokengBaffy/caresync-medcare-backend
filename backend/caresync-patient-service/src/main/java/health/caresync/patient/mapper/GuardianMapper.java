package health.caresync.patient.mapper;

import health.caresync.patient.domain.entity.Guardian;
import health.caresync.patient.dto.GuardianCreateRequest;
import health.caresync.patient.dto.GuardianResponse;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class GuardianMapper {
    public Guardian toEntity(UUID tenantId, UUID patientId, GuardianCreateRequest request) {
        return new Guardian(
            tenantId,
            patientId,
            request.guardianUserId(),
            request.fullName(),
            request.relationshipType(),
            request.email(),
            request.phone(),
            request.primaryContact()
        );
    }

    public GuardianResponse toResponse(Guardian guardian) {
        return new GuardianResponse(
            guardian.getId(),
            guardian.getPatientId(),
            guardian.getGuardianUserId(),
            guardian.getFullName(),
            guardian.getRelationshipType(),
            guardian.getEmail(),
            guardian.getPhone(),
            guardian.isPrimaryContact(),
            guardian.getCreatedAt()
        );
    }
}