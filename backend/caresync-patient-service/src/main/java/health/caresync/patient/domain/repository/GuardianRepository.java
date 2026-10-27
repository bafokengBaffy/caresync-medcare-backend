package health.caresync.patient.domain.repository;

import health.caresync.patient.domain.entity.Guardian;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GuardianRepository extends JpaRepository<Guardian, UUID> {
    List<Guardian> findAllByTenantIdAndPatientIdOrderByCreatedAtDesc(UUID tenantId, UUID patientId);

    Optional<Guardian> findByIdAndTenantIdAndPatientId(UUID id, UUID tenantId, UUID patientId);

    boolean existsByTenantIdAndPatientIdAndGuardianUserId(
        UUID tenantId,
        UUID patientId,
        String guardianUserId
    );
}