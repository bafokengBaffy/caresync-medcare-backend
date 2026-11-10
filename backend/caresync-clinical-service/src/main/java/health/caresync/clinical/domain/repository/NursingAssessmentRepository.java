package health.caresync.clinical.domain.repository;

import health.caresync.clinical.domain.entity.NursingAssessment;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NursingAssessmentRepository extends JpaRepository<NursingAssessment, UUID> {
    Optional<NursingAssessment> findByIdAndTenantId(UUID id, UUID tenantId);
    Optional<NursingAssessment> findByIdAndTenantIdAndProviderId(UUID id, UUID tenantId, UUID providerId);
    List<NursingAssessment> findTop100ByTenantIdOrderByAssessmentDateDesc(UUID tenantId);
    List<NursingAssessment> findTop100ByTenantIdAndProviderIdOrderByAssessmentDateDesc(
        UUID tenantId,
        UUID providerId
    );
    List<NursingAssessment> findTop100ByTenantIdAndPatientIdOrderByAssessmentDateDesc(
        UUID tenantId,
        UUID patientId
    );
    List<NursingAssessment> findTop100ByTenantIdAndPatientIdAndProviderIdOrderByAssessmentDateDesc(
        UUID tenantId,
        UUID patientId,
        UUID providerId
    );
}