package health.caresync.patient.domain.repository;

import health.caresync.patient.domain.entity.PatientDocument;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientDocumentRepository extends JpaRepository<PatientDocument, UUID> {
    List<PatientDocument> findAllByTenantIdAndPatientIdOrderByUploadedAtDesc(UUID tenantId, UUID patientId);

    Optional<PatientDocument> findByIdAndTenantIdAndPatientId(UUID id, UUID tenantId, UUID patientId);
}
