package health.caresync.patient.domain.repository;

import health.caresync.patient.domain.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Patient data.
 * OWASP Alignment: Extends JpaSpecificationExecutor to allow building dynamic, 
 * tenant-scoped queries safely. NOTE: The Tenant filtering is enforced by the
 * Hibernate filter configured in the infrastructure layer.
 */
@Repository
public interface PatientRepository extends JpaRepository<Patient, UUID>, JpaSpecificationExecutor<Patient> {
    
    Optional<Patient> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<Patient> findByIdAndTenantId(UUID id, UUID tenantId);
    Optional<Patient> findByIdAndTenantIdAndMergedIntoPatientIdIsNull(UUID id, UUID tenantId);
    boolean existsByIdAndTenantId(UUID id, UUID tenantId);
    boolean existsByTenantIdAndEmailIgnoreCase(UUID tenantId, String email);
    List<Patient> findAllByTenantId(UUID tenantId);
    Page<Patient> findAllByTenantIdAndMergedIntoPatientIdIsNull(UUID tenantId, Pageable pageable);

    @Query("""
        select p from Patient p
        where p.tenantId = :tenantId
          and p.mergedIntoPatientId is null
          and (:query = '' or lower(p.firstName) like lower(concat('%', :query, '%'))
               or lower(p.lastName) like lower(concat('%', :query, '%'))
               or lower(coalesce(p.email, '')) like lower(concat('%', :query, '%'))
               or lower(coalesce(p.phone, '')) like lower(concat('%', :query, '%')))
        """)
    Page<Patient> searchByTenantId(
        @Param("tenantId") UUID tenantId,
        @Param("query") String query,
        Pageable pageable
    );
}
