package health.caresync.clinical.domain.repository;

import health.caresync.clinical.domain.entity.EyeExam;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EyeExamRepository extends JpaRepository<EyeExam, UUID> {
    Optional<EyeExam> findByIdAndTenantIdAndArchivedAtIsNull(UUID id, UUID tenantId);
    Optional<EyeExam> findByIdAndTenantIdAndProviderIdAndArchivedAtIsNull(UUID id, UUID tenantId, UUID providerId);
    List<EyeExam> findTop100ByTenantIdAndArchivedAtIsNullOrderByExamDateDesc(UUID tenantId);
    List<EyeExam> findTop100ByTenantIdAndProviderIdAndArchivedAtIsNullOrderByExamDateDesc(UUID tenantId, UUID providerId);
    List<EyeExam> findTop100ByTenantIdAndPatientIdAndArchivedAtIsNullOrderByExamDateDesc(UUID tenantId, UUID patientId);
    List<EyeExam> findTop100ByTenantIdAndPatientIdAndProviderIdAndArchivedAtIsNullOrderByExamDateDesc(
        UUID tenantId,
        UUID patientId,
        UUID providerId
    );
}