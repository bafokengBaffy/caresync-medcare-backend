package health.caresync.patient.domain.repository;
import health.caresync.patient.domain.entity.Patient;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.jpa.domain.Specification;
import java.util.*;
public interface PatientRepository extends JpaRepository<Patient, UUID>, JpaSpecificationExecutor<Patient> {
    Optional<Patient> findByIdAndTenantId(UUID id, UUID tenantId);
    boolean existsByTenantIdAndEmailIgnoreCase(UUID tenantId, String email);
    List<Patient> findAllByTenantId(UUID tenantId);
}