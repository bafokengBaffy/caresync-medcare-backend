package health.caresync.patient.domain.repository;

import health.caresync.patient.domain.entity.PatientMergeLog;
import health.caresync.patient.domain.valueobject.MergeStatus;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PatientMergeLogRepository
    extends JpaRepository<PatientMergeLog, UUID>, JpaSpecificationExecutor<PatientMergeLog> {
    Optional<PatientMergeLog> findByIdAndTenantId(UUID id, UUID tenantId);

    List<PatientMergeLog> findAllByTenantIdAndSourcePatientIdOrTenantIdAndTargetPatientIdOrderByRequestedAtDesc(
        UUID sourceTenantId,
        UUID sourcePatientId,
        UUID targetTenantId,
        UUID targetPatientId
    );

    Page<PatientMergeLog> findAllByTenantId(UUID tenantId, Pageable pageable);

    boolean existsByTenantIdAndSourcePatientIdAndTargetPatientIdAndStatus(
        UUID tenantId,
        UUID sourcePatientId,
        UUID targetPatientId,
        MergeStatus status
    );

    long countByTenantIdAndStatus(UUID tenantId, MergeStatus status);

    long countByTenantId(UUID tenantId);

    long countByTenantIdAndRequestedAtBetween(UUID tenantId, Instant from, Instant to);
}