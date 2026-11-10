package health.caresync.clinical.domain.repository;

import health.caresync.clinical.domain.entity.DentalChart;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DentalChartRepository extends JpaRepository<DentalChart, UUID> {
    Optional<DentalChart> findByIdAndTenantIdAndArchivedAtIsNull(UUID id, UUID tenantId);
    Optional<DentalChart> findByIdAndTenantIdAndProviderIdAndArchivedAtIsNull(UUID id, UUID tenantId, UUID providerId);
    List<DentalChart> findTop100ByTenantIdAndArchivedAtIsNullOrderByChartDateDesc(UUID tenantId);
    List<DentalChart> findTop100ByTenantIdAndProviderIdAndArchivedAtIsNullOrderByChartDateDesc(UUID tenantId, UUID providerId);
    List<DentalChart> findTop100ByTenantIdAndPatientIdAndArchivedAtIsNullOrderByChartDateDesc(UUID tenantId, UUID patientId);
    List<DentalChart> findTop100ByTenantIdAndPatientIdAndProviderIdAndArchivedAtIsNullOrderByChartDateDesc(
        UUID tenantId,
        UUID patientId,
        UUID providerId
    );
}