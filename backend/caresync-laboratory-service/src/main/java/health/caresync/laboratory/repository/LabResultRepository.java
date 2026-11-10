package health.caresync.laboratory.repository;

import health.caresync.laboratory.domain.LabResult;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LabResultRepository extends JpaRepository<LabResult, UUID> {
    Optional<LabResult> findByIdAndTenantIdAndArchivedAtIsNull(UUID id, UUID tenantId);
    Optional<LabResult> findByIdAndTenantIdAndProviderIdAndArchivedAtIsNull(
        UUID id,
        UUID tenantId,
        UUID providerId
    );
    List<LabResult> findTop100ByTenantIdAndArchivedAtIsNullOrderByOrderedAtDesc(UUID tenantId);
    List<LabResult> findTop100ByTenantIdAndPatientIdAndArchivedAtIsNullOrderByOrderedAtDesc(
        UUID tenantId,
        UUID patientId
    );
    List<LabResult> findTop100ByTenantIdAndProviderIdAndArchivedAtIsNullOrderByOrderedAtDesc(
        UUID tenantId,
        UUID providerId
    );
    List<LabResult> findTop100ByTenantIdAndPatientIdAndProviderIdAndArchivedAtIsNullOrderByOrderedAtDesc(
        UUID tenantId,
        UUID patientId,
        UUID providerId
    );
}
