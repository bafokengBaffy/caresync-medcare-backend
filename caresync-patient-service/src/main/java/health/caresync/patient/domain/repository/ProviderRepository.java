package health.caresync.patient.domain.repository;
import health.caresync.patient.domain.entity.Provider;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
import java.util.*;
public interface ProviderRepository extends JpaRepository<Provider, UUID>, JpaSpecificationExecutor<Provider> {
    Optional<Provider> findByIdAndTenantId(UUID id, UUID tenantId);
    List<Provider> findAllByTenantIdAndSpecialty(UUID tenantId, String specialty);
    Page<Provider> findAllByTenantId(UUID tenantId, Pageable pageable);
    boolean existsByTenantIdAndUserId(UUID tenantId, String userId);
    @Query("""
        select p from Provider p
        where p.tenantId = :tenantId
          and (:query = '' or lower(p.firstName) like lower(concat('%', :query, '%'))
               or lower(p.lastName) like lower(concat('%', :query, '%'))
               or lower(coalesce(p.email, '')) like lower(concat('%', :query, '%'))
               or lower(coalesce(p.npi, '')) like lower(concat('%', :query, '%')))
          and (:specialty = '' or p.specialty = :specialty)
          and (:active is null or p.active = :active)
        """)
    Page<Provider> searchByTenantId(
        @Param("tenantId") UUID tenantId,
        @Param("query") String query,
        @Param("specialty") String specialty,
        @Param("active") Boolean active,
        Pageable pageable
    );
}