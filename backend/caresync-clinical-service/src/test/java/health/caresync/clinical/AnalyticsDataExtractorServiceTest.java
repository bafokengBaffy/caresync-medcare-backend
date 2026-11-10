package health.caresync.clinical;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

import health.caresync.clinical.dto.AnalyticsCohort;
import health.caresync.clinical.dto.AnalyticsExportResponse;
import health.caresync.clinical.service.AnalyticsDataExtractorService;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.tenant.TenantRlsContext;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

class AnalyticsDataExtractorServiceTest {
    @Test
    void csvContainsOnlyAggregatedFieldsAndEscapesDiagnosisValues() {
        AnalyticsDataExtractorService service = new AnalyticsDataExtractorService(
            mock(JdbcTemplate.class),
            mock(TenantRlsContext.class)
        );
        AnalyticsExportResponse response = new AnalyticsExportResponse(
            UUID.randomUUID(),
            LocalDate.of(2025, 1, 1),
            LocalDate.of(2025, 12, 31),
            5,
            Instant.parse("2026-01-01T00:00:00Z"),
            List.of(new AnalyticsCohort(
                "35-49",
                "OTHER_OR_UNKNOWN",
                "ICD-10",
                "A,\"B",
                "2-3",
                7,
                2.43
            ))
        );

        String csv = service.toCsv(response);

        assertEquals(
            "from_date,to_date,minimum_cohort_size,age_band,gender_group,diagnosis_system,"
                + "diagnosis_code,appointment_frequency_band,patient_count,average_appointments\r\n"
                + "2025-01-01,2025-12-31,5,\"35-49\",\"OTHER_OR_UNKNOWN\",\"ICD-10\","
                + "\"A,\"\"B\",\"2-3\",7,2.43\r\n",
            csv
        );
        org.junit.jupiter.api.Assertions.assertFalse(csv.contains("patient_id"));
    }

    @Test
    void rejectsInvalidDateRangeBeforeQueryingTenantData() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        TenantRlsContext tenantRlsContext = mock(TenantRlsContext.class);
        AnalyticsDataExtractorService service =
            new AnalyticsDataExtractorService(jdbcTemplate, tenantRlsContext);

        assertThrows(
            ValidationException.class,
            () -> service.extract(LocalDate.of(2025, 12, 31), LocalDate.of(2025, 1, 1))
        );

        verifyNoInteractions(jdbcTemplate, tenantRlsContext);
    }
}
