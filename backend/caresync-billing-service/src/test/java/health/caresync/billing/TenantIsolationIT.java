package health.caresync.billing;

import health.caresync.billing.domain.entity.FinancialReport;
import health.caresync.billing.domain.repository.FinancialReportRepository;
import health.caresync.common.security.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * Verifies the invariant that no tenant can read another tenant's rows
 * at the repository query level.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class TenantIsolationIT {

    @Autowired
    private FinancialReportRepository repository;

    @AfterEach
    void clear() {
        TenantContext.clear();
    }

    @Test
    void repository_neverReturnsOtherTenantsRows() {
        FinancialReport a = new FinancialReport("tenant-A", "ZAR",
                Instant.parse("2026-01-01T00:00:00Z"),
                Instant.parse("2026-02-01T00:00:00Z"),
                BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ZERO, BigDecimal.ZERO, "actor-a");
        FinancialReport b = new FinancialReport("tenant-B", "ZAR",
                Instant.parse("2026-01-01T00:00:00Z"),
                Instant.parse("2026-02-01T00:00:00Z"),
                BigDecimal.ONE, BigDecimal.ZERO, BigDecimal.ONE, BigDecimal.ZERO, "actor-b");
        repository.saveAll(List.of(a, b));

        TenantContext.setTenantId("tenant-A");
        List<FinancialReport> aResults = repository.findAllByTenantIdOrderByCreatedAtDesc("tenant-A");
        assertThat(aResults).allMatch(r -> "tenant-A".equals(r.getTenantId()));

        TenantContext.setTenantId("tenant-B");
        List<FinancialReport> bResults = repository.findAllByTenantIdOrderByCreatedAtDesc("tenant-B");
        assertThat(bResults).allMatch(r -> "tenant-B".equals(r.getTenantId()));
    }

    @Test
    void findByIdAndTenantId_blocksCrossTenantLookup() {
        FinancialReport a = new FinancialReport("tenant-A", "ZAR",
                Instant.parse("2026-01-01T00:00:00Z"),
                Instant.parse("2026-02-01T00:00:00Z"),
                BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ZERO, BigDecimal.ZERO, "actor-a");
        FinancialReport saved = repository.save(a);

        assertThat(repository.findByIdAndTenantId(saved.getId(), "tenant-B")).isEmpty();
        assertThat(repository.findByIdAndTenantId(saved.getId(), "tenant-A")).isPresent();
    }
}