package health.caresync.patient.domain.repository;
import health.caresync.patient.domain.entity.Patient;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.jpa.domain.Specification;
import java.util.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
public interface PatientRepository extends JpaRepository<Patient, UUID>, JpaSpecificationExecutor<Patient> {
    Optional<Patient> findByIdAndTenantId(UUID id, UUID tenantId);
    boolean existsByTenantIdAndEmailIgnoreCase(UUID tenantId, String email);
    List<Patient> findAllByTenantId(UUID tenantId);
    @Query("""
        select p from Patient p
        where p.tenantId = :tenantId
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