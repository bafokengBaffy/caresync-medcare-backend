package health.caresync.billing.domain.repository;

import health.caresync.billing.domain.entity.ProBonoRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProBonoRecordRepository extends JpaRepository<ProBonoRecord, String> {
    List<ProBonoRecord> findAllByTenantIdOrderByApprovedAtDesc(String tenantId);
}