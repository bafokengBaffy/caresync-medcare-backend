package health.caresync.billing;

import health.caresync.billing.domain.entity.FinancialReport;
import health.caresync.billing.domain.repository.FinancialReportRepository;
import health.caresync.billing.dto.FinancialReportRequest;
import health.caresync.billing.dto.FinancialReportResponse;
import health.caresync.billing.service.FinancialReportService;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.security.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class FinancialReportServiceTest {

    private FinancialReportRepository repository;
    private FinancialReportService service;

    @BeforeEach
    void setUp() {
        repository = Mockito.mock(FinancialReportRepository.class);
        service = new FinancialReportService(repository);
        TenantContext.setTenantId("tenant-A");
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void generate_rejectsMissingTenant() {
        TenantContext.clear();
        FinancialReportRequest req = new FinancialReportRequest(
                Instant.parse("2026-01-01T00:00:00Z"),
                Instant.parse("2026-02-01T00:00:00Z"), "ZAR");
        assertThatThrownBy(() -> service.generate(req, "actor"))
                .isInstanceOf(ValidationException.class);
    }

    @Test
    void generate_rejectsInvertedPeriod() {
        FinancialReportRequest req = new FinancialReportRequest(
                Instant.parse("2026-02-01T00:00:00Z"),
                Instant.parse("2026-01-01T00:00:00Z"), "ZAR");
        assertThatThrownBy(() -> service.generate(req, "actor"))
                .isInstanceOf(ValidationException.class);
    }

    @Test
    void generate_persistsImmutableReport() {
        when(repository.save(any(FinancialReport.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        FinancialReportRequest req = new FinancialReportRequest(
                Instant.parse("2026-01-01T00:00:00Z"),
                Instant.parse("2026-02-01T00:00:00Z"), "ZAR");

        FinancialReportResponse resp = service.generate(req, "actor-1");
        assertThat(resp.tenantId()).isEqualTo("tenant-A");
        assertThat(resp.currency()).isEqualTo("ZAR");
        assertThat(resp.createdBy()).isEqualTo("actor-1");
    }

    @Test
    void get_returnsNotFoundForOtherTenant() {
        when(repository.findByIdAndTenantId("x", "tenant-A")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.get("x"))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void list_scopedToTenant() {
        when(repository.findAllByTenantIdOrderByCreatedAtDesc("tenant-A"))
                .thenReturn(List.of());
        assertThat(service.listForTenant()).isEmpty();
    }
}