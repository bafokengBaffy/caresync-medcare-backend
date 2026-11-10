package health.caresync.laboratory.domain.repository;
import health.caresync.laboratory.domain.entity.LabResult;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List; import java.util.UUID;
public interface LabResultRepository extends JpaRepository<LabResult, UUID> {
    List<LabResult> findByPatientId(String patientId);
}
