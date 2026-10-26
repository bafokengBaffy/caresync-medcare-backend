package health.caresync.patient.domain.repository;
import health.caresync.patient.domain.entity.Provider;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.jpa.domain.Specification;
import java.util.*;
public interface ProviderRepository extends JpaRepository<Provider, UUID>, JpaSpecificationExecutor<Provider> {
    Optional<Provider> findByIdAndTenantId(UUID id, UUID tenantId);
    List<Provider> findAllByTenantIdAndSpecialty(UUID tenantId, String specialty);
}