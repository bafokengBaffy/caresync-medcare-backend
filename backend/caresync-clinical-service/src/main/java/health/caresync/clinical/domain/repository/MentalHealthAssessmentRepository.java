package health.caresync.clinical.domain.repository;

import health.caresync.clinical.domain.entity.MentalHealthAssessment;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MentalHealthAssessmentRepository extends JpaRepository<MentalHealthAssessment, UUID> {
    Optional<MentalHealthAssessment> findByIdAndTenantId(UUID id, UUID tenantId);
    Optional<MentalHealthAssessment> findByIdAndTenantIdAndProviderId(UUID id, UUID tenantId, UUID providerId);
    List<MentalHealthAssessment> findTop100ByTenantIdOrderByAssessmentDateDesc(UUID tenantId);
    List<MentalHealthAssessment> findTop100ByTenantIdAndProviderIdOrderByAssessmentDateDesc(
        UUID tenantId,
        UUID providerId
    );
    List<MentalHealthAssessment> findTop100ByTenantIdAndPatientIdOrderByAssessmentDateDesc(
        UUID tenantId,
        UUID patientId
    );
    List<MentalHealthAssessment> findTop100ByTenantIdAndPatientIdAndProviderIdOrderByAssessmentDateDesc(
        UUID tenantId,
        UUID patientId,
        UUID providerId
    );
}