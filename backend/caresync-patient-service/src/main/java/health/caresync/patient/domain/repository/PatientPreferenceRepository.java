package health.caresync.patient.domain.repository;

import health.caresync.patient.domain.entity.PatientPreference;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientPreferenceRepository extends JpaRepository<PatientPreference, UUID> {
    Optional<PatientPreference> findByTenantIdAndPatientId(UUID tenantId, UUID patientId);
}