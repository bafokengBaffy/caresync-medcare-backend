package health.caresync.patient.domain.repository;

import health.caresync.patient.domain.entity.PatientDocument;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PatientDocumentRepository extends JpaRepository<PatientDocument, UUID> {
    List<PatientDocument> findAllByTenantIdAndPatientIdOrderByUploadedAtDesc(UUID tenantId, UUID patientId);

    Optional<PatientDocument> findByIdAndTenantIdAndPatientId(UUID id, UUID tenantId, UUID patientId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select document from PatientDocument document
        where document.id = :documentId
          and document.tenantId = :tenantId
          and document.patientId = :patientId
        """)
    Optional<PatientDocument> lockByDocumentIdAndTenantIdAndPatientId(
        @Param("documentId") UUID documentId,
        @Param("tenantId") UUID tenantId,
        @Param("patientId") UUID patientId
    );
}
