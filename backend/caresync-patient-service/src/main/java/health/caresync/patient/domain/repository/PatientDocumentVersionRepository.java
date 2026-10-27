package health.caresync.patient.domain.repository;

import health.caresync.patient.domain.entity.PatientDocumentVersion;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PatientDocumentVersionRepository extends JpaRepository<PatientDocumentVersion, UUID> {
    List<PatientDocumentVersion> findAllByTenantIdAndPatientIdAndDocumentIdOrderByVersionNumberDesc(
        UUID tenantId,
        UUID patientId,
        UUID documentId
    );

    Optional<PatientDocumentVersion> findByTenantIdAndPatientIdAndDocumentIdAndVersionNumber(
        UUID tenantId,
        UUID patientId,
        UUID documentId,
        int versionNumber
    );

    @Query("""
        select coalesce(max(version.versionNumber), 0)
        from PatientDocumentVersion version
        where version.tenantId = :tenantId
          and version.patientId = :patientId
          and version.documentId = :documentId
        """)
    int findMaxVersionNumber(
        @Param("tenantId") UUID tenantId,
        @Param("patientId") UUID patientId,
        @Param("documentId") UUID documentId
    );
}