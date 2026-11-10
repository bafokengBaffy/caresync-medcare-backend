package health.caresync.payroll.repository;

import health.caresync.payroll.domain.EmployeeRecord;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployeeRecordRepository extends JpaRepository<EmployeeRecord, UUID> {
    List<EmployeeRecord> findAllByTenantIdAndActiveTrueOrderByEmployeeCode(UUID tenantId);
}
