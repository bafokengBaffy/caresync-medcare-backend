package health.caresync.payroll.service;

import java.time.YearMonth;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class PayrollScheduler {
    private static final Logger logger = LoggerFactory.getLogger(PayrollScheduler.class);

    private final JdbcTemplate jdbcTemplate;
    private final PayrollService payrollService;
    private final ZoneId payrollZone;

    public PayrollScheduler(
        JdbcTemplate jdbcTemplate,
        PayrollService payrollService,
        @Value("${caresync.payroll.timezone:UTC}") String timezone
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.payrollService = payrollService;
        this.payrollZone = ZoneId.of(timezone);
    }

    @Scheduled(cron = "0 0 2 25 * *", zone = "${caresync.payroll.timezone:UTC}")
    public void runMonthlyPayroll() {
        YearMonth period = YearMonth.now(payrollZone);
        List<UUID> tenantIds = jdbcTemplate.query(
            "select id from public.tenants where is_active = true order by id",
            (resultSet, rowNumber) -> resultSet.getObject("id", UUID.class)
        );
        for (UUID tenantId : tenantIds) {
            try {
                List<?> generated = payrollService.runPayrollForTenant(tenantId, period);
                logger.info(
                    "Generated or confirmed {} payslips for tenant {} and period {}",
                    generated.size(),
                    tenantId,
                    period
                );
            } catch (RuntimeException e) {
                logger.error("Payroll run failed for tenant {} and period {}", tenantId, period, e);
            }
        }
    }
}
