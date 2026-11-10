package health.caresync.payroll.repository;

import health.caresync.payroll.domain.Payslip;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PayslipRepository extends JpaRepository<Payslip, UUID> {
    boolean existsByTenantIdAndEmployeeIdAndPayPeriodStart(
        UUID tenantId,
        UUID employeeId,
        LocalDate payPeriodStart
    );

    List<Payslip> findAllByTenantIdAndPayPeriodStartOrderByEmployeeId(
        UUID tenantId,
        LocalDate payPeriodStart
    );
}
