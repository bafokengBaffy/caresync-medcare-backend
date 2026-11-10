package health.caresync.clinical.service;

import health.caresync.clinical.dto.AnalyticsCohort;
import health.caresync.clinical.dto.AnalyticsExportResponse;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.tenant.TenantRlsContext;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AnalyticsDataExtractorService {
    private static final int MINIMUM_COHORT_SIZE = 5;

    private static final String COHORT_QUERY = """
        WITH appointment_counts AS (
            SELECT a.patient_id, COUNT(*)::BIGINT AS appointment_count
            FROM public.appointments a
            WHERE a.tenant_id = ?
              AND a.scheduled_start >= ?
              AND a.scheduled_start < ?
              AND a.status IN ('COMPLETED', 'SCHEDULED', 'PENDING_CONFIRMATION')
            GROUP BY a.patient_id
        ),
        patient_cohorts AS (
            SELECT
                p.id AS patient_id,
                CASE
                    WHEN age.years < 18 THEN '0-17'
                    WHEN age.years < 35 THEN '18-34'
                    WHEN age.years < 50 THEN '35-49'
                    WHEN age.years < 65 THEN '50-64'
                    ELSE '65+'
                END AS age_band,
                CASE
                    WHEN LOWER(BTRIM(COALESCE(p.gender, ''))) IN ('m', 'male', 'man') THEN 'MALE'
                    WHEN LOWER(BTRIM(COALESCE(p.gender, ''))) IN ('f', 'female', 'woman') THEN 'FEMALE'
                    WHEN LOWER(BTRIM(COALESCE(p.gender, ''))) IN
                        ('nonbinary', 'non-binary', 'non binary', 'x') THEN 'NON_BINARY'
                    ELSE 'OTHER_OR_UNKNOWN'
                END AS gender_group,
                COALESCE(d.coding_system, 'NONE') AS diagnosis_system,
                COALESCE(d.diagnosis_code, 'NONE_RECORDED') AS diagnosis_code,
                COALESCE(ac.appointment_count, 0) AS appointment_count
            FROM public.patients p
            CROSS JOIN LATERAL (
                SELECT DATE_PART('year', AGE(CAST(? AS DATE), p.date_of_birth))::INTEGER AS years
            ) age
            LEFT JOIN appointment_counts ac ON ac.patient_id = p.id
            LEFT JOIN patient_diagnosis_codes d
                ON d.tenant_id = p.tenant_id
                AND d.patient_id = p.id
                AND d.is_active = TRUE
                AND d.coded_on <= CAST(? AS DATE)
            WHERE p.tenant_id = ?
              AND p.merged_into_patient_id IS NULL
        )
        SELECT
            age_band,
            gender_group,
            diagnosis_system,
            diagnosis_code,
            CASE
                WHEN appointment_count = 0 THEN '0'
                WHEN appointment_count = 1 THEN '1'
                WHEN appointment_count BETWEEN 2 AND 3 THEN '2-3'
                WHEN appointment_count BETWEEN 4 AND 7 THEN '4-7'
                ELSE '8+'
            END AS appointment_frequency_band,
            COUNT(DISTINCT patient_id)::BIGINT AS patient_count,
            ROUND(AVG(appointment_count)::NUMERIC, 2)::DOUBLE PRECISION AS average_appointments
        FROM patient_cohorts
        GROUP BY age_band, gender_group, diagnosis_system, diagnosis_code,
            appointment_frequency_band
        HAVING COUNT(DISTINCT patient_id) >= ?
        ORDER BY age_band, gender_group, diagnosis_system, diagnosis_code,
            appointment_frequency_band
        """;

    private static final RowMapper<AnalyticsCohort> COHORT_ROW_MAPPER = (rs, rowNum) ->
        new AnalyticsCohort(
            rs.getString("age_band"),
            rs.getString("gender_group"),
            rs.getString("diagnosis_system"),
            rs.getString("diagnosis_code"),
            rs.getString("appointment_frequency_band"),
            rs.getLong("patient_count"),
            rs.getDouble("average_appointments")
        );

    private final JdbcTemplate jdbcTemplate;
    private final TenantRlsContext tenantRlsContext;

    public AnalyticsDataExtractorService(
        JdbcTemplate jdbcTemplate,
        TenantRlsContext tenantRlsContext
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.tenantRlsContext = tenantRlsContext;
    }

    @Transactional
    public AnalyticsExportResponse extract(LocalDate fromDate, LocalDate toDate) {
        if (fromDate == null || toDate == null || fromDate.isAfter(toDate)) {
            throw new ValidationException("A valid analytics date range is required");
        }
        if (toDate.isAfter(LocalDate.now()) || fromDate.isBefore(toDate.minusYears(5))) {
            throw new ValidationException("Analytics date range must be within the past five years");
        }
        UUID tenantId = tenantRlsContext.apply();
        List<AnalyticsCohort> cohorts = jdbcTemplate.query(
            COHORT_QUERY,
            COHORT_ROW_MAPPER,
            tenantId,
            fromDate.atStartOfDay(ZoneOffset.UTC).toInstant(),
            toDate.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant(),
            toDate,
            toDate,
            tenantId,
            MINIMUM_COHORT_SIZE
        );
        recordExport(tenantId);
        return new AnalyticsExportResponse(
            tenantId,
            fromDate,
            toDate,
            MINIMUM_COHORT_SIZE,
            Instant.now(),
            cohorts
        );
    }

    public String toCsv(AnalyticsExportResponse export) {
        StringBuilder csv = new StringBuilder(
            "from_date,to_date,minimum_cohort_size,age_band,gender_group,diagnosis_system,diagnosis_code,"
                + "appointment_frequency_band,patient_count,average_appointments\r\n"
        );
        for (AnalyticsCohort cohort : export.cohorts()) {
            csv.append(export.fromDate()).append(',')
                .append(export.toDate()).append(',')
                .append(export.minimumCohortSize()).append(',')
                .append(csvField(cohort.ageBand())).append(',')
                .append(csvField(cohort.genderGroup())).append(',')
                .append(csvField(cohort.diagnosisSystem())).append(',')
                .append(csvField(cohort.diagnosisCode())).append(',')
                .append(csvField(cohort.appointmentFrequencyBand())).append(',')
                .append(cohort.patientCount()).append(',')
                .append(cohort.averageAppointments()).append("\r\n");
        }
        return csv.toString();
    }

    private void recordExport(UUID tenantId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication == null ? null : authentication.getPrincipal();
        String userId = principal instanceof CaresyncPrincipal caresyncPrincipal
            ? caresyncPrincipal.userId()
            : authentication == null ? null : authentication.getName();
        String role = principal instanceof CaresyncPrincipal caresyncPrincipal
            ? caresyncPrincipal.role()
            : null;
        jdbcTemplate.update(
            """
            INSERT INTO public.audit_logs
                (tenant_id, actor_user_id, actor_role, action, resource_type, resource_id)
            VALUES (?, ?, ?, 'ANALYTICS_DATA_EXPORTED', 'clinical_analytics', 'cohort_export')
            """,
            tenantId,
            userId,
            role
        );
    }

    private static String csvField(String value) {
        String safe = value == null ? "" : value;
        return "\"" + safe.replace("\"", "\"\"") + "\"";
    }
}
