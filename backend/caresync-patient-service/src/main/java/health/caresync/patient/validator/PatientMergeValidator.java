package health.caresync.patient.validator;

import health.caresync.common.exception.ConflictException;
import health.caresync.common.exception.ValidationException;
import health.caresync.patient.domain.repository.PatientMergeLogRepository;
import health.caresync.patient.domain.valueobject.MergeStatus;
import health.caresync.patient.dto.PatientMergeRequest;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class PatientMergeValidator {
    private final PatientMergeLogRepository mergeRepository;

    public PatientMergeValidator(PatientMergeLogRepository mergeRepository) {
        this.mergeRepository = mergeRepository;
    }

    public void validate(UUID tenantId, PatientMergeRequest request) {
        if (tenantId == null || request == null
            || request.sourcePatientId() == null || request.targetPatientId() == null) {
            throw new ValidationException("Tenant, source patient, and target patient are required");
        }
        UUID sourcePatientId = request.sourcePatientId();
        UUID targetPatientId = request.targetPatientId();
        if (sourcePatientId.equals(targetPatientId)) {
            throw new ValidationException("A patient cannot be merged into itself");
        }
        if (request.reason() == null || request.reason().isBlank() || request.reason().length() > 1000) {
            throw new ValidationException("A merge reason of at most 1000 characters is required");
        }
        boolean pending = mergeRepository.existsByTenantIdAndSourcePatientIdAndTargetPatientIdAndStatus(
            tenantId, sourcePatientId, targetPatientId, MergeStatus.PENDING
        ) || mergeRepository.existsByTenantIdAndSourcePatientIdAndTargetPatientIdAndStatus(
            tenantId, targetPatientId, sourcePatientId, MergeStatus.PENDING
        );
        if (pending) {
            throw new ConflictException("A merge request for this patient pair is already pending");
        }
    }
}