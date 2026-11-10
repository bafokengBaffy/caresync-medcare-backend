package health.caresync.patient.domain.repository;

import health.caresync.patient.domain.entity.PatientReferral;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientReferralRepository extends JpaRepository<PatientReferral, UUID> {
    Page<PatientReferral> findAllByTenantIdAndPatientId(UUID tenantId, UUID patientId, Pageable pageable);

    Optional<PatientReferral> findByIdAndTenantIdAndPatientId(UUID id, UUID tenantId, UUID patientId);
}
