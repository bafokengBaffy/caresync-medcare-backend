package health.caresync.patient.domain.repository;

import health.caresync.patient.domain.entity.ConsentHistory;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientConsentHistoryRepository extends JpaRepository<ConsentHistory, UUID> {
    List<ConsentHistory> findAllByTenantIdAndConsentIdOrderByOccurredAtDesc(UUID tenantId, UUID consentId);
}