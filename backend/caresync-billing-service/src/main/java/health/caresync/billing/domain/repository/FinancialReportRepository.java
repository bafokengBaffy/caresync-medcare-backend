package health.caresync.billing.domain.repository;

import health.caresync.billing.domain.entity.FinancialReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FinancialReportRepository extends JpaRepository<FinancialReport, String> {
    List<FinancialReport> findAllByTenantIdOrderByCreatedAtDesc(String tenantId);

    Optional<FinancialReport> findByIdAndTenantId(String id, String tenantId);
}