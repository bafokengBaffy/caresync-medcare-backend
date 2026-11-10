package health.caresync.clinical.domain;

import health.caresync.clinical.domain.entity.PatientDiagnosisCode;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientDiagnosisCodeRepository extends JpaRepository<PatientDiagnosisCode, UUID> {
}
