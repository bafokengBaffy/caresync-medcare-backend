package health.caresync.patient.service;

import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.exception.NotFoundException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.patient.dto.portal.PatientAppointmentItem;
import health.caresync.patient.dto.portal.PatientInvoiceItem;
import health.caresync.patient.dto.portal.PatientPortalProfile;
import health.caresync.patient.dto.portal.PatientRecordItem;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PatientPortalService {
    private final JdbcTemplate jdbcTemplate;
    private final TenantRlsContext tenantRlsContext;

    public PatientPortalService(JdbcTemplate jdbcTemplate, TenantRlsContext tenantRlsContext) {
        this.jdbcTemplate = jdbcTemplate;
        this.tenantRlsContext = tenantRlsContext;
    }

    @Transactional(readOnly = true)
    public PatientPortalProfile profile(CaresyncPrincipal actor) {
        PatientIdentity patient = resolvePatient(actor);
        List<PatientPortalProfile> result = jdbcTemplate.query("""
            SELECT p.first_name, p.last_name, p.email, p.phone, p.date_of_birth, t.name AS tenant_name
            FROM patients p
            JOIN tenants t ON t.id = p.tenant_id
            WHERE p.id = ? AND p.tenant_id = ? AND p.firebase_uid = ?
                AND p.merged_into_patient_id IS NULL
            """,
            (resultSet, rowNumber) -> new PatientPortalProfile(
                patient.patientId(),
                resultSet.getString("first_name"),
                resultSet.getString("last_name"),
                resultSet.getString("email"),
                resultSet.getString("phone"),
                resultSet.getObject("date_of_birth", LocalDate.class),
                resultSet.getString("tenant_name")
            ),
            patient.patientId(),
            patient.tenantId(),
            actor.userId()
        );
        if (result.isEmpty()) throw new NotFoundException("Linked patient record not found");
        return result.get(0);
    }

    @Transactional(readOnly = true)
    public List<PatientAppointmentItem> appointments(CaresyncPrincipal actor) {
        PatientIdentity patient = resolvePatient(actor);
        return jdbcTemplate.query("""
            SELECT a.id, a.scheduled_start, a.scheduled_end, a.status, a.appointment_type,
                   p.first_name AS provider_first_name, p.last_name AS provider_last_name,
                   p.specialty
            FROM appointments a
            JOIN providers p ON p.id = a.provider_id AND p.tenant_id = a.tenant_id
            WHERE a.tenant_id = ? AND a.patient_id = ?
            ORDER BY a.scheduled_start DESC
            LIMIT 200
            """,
            (resultSet, rowNumber) -> new PatientAppointmentItem(
                resultSet.getObject("id", UUID.class),
                instant(resultSet, "scheduled_start"),
                instant(resultSet, "scheduled_end"),
                resultSet.getString("status"),
                resultSet.getString("appointment_type"),
                (resultSet.getString("provider_first_name") + " "
                    + resultSet.getString("provider_last_name")).trim(),
                resultSet.getString("specialty")
            ),
            patient.tenantId(),
            patient.patientId()
        );
    }

    @Transactional(readOnly = true)
    public List<PatientInvoiceItem> invoices(CaresyncPrincipal actor) {
        PatientIdentity patient = resolvePatient(actor);
        return jdbcTemplate.query("""
            SELECT id, invoice_number, amount_cents, currency, status, issued_at, due_at, paid_at
            FROM invoices
            WHERE tenant_id = ? AND patient_id = ? AND status <> 'DRAFT'
            ORDER BY COALESCE(issued_at, created_at) DESC
            LIMIT 200
            """,
            (resultSet, rowNumber) -> new PatientInvoiceItem(
                resultSet.getObject("id", UUID.class),
                resultSet.getString("invoice_number"),
                resultSet.getLong("amount_cents"),
                resultSet.getString("currency"),
                resultSet.getString("status"),
                instant(resultSet, "issued_at"),
                instant(resultSet, "due_at"),
                instant(resultSet, "paid_at")
            ),
            patient.tenantId(),
            patient.patientId()
        );
    }

    @Transactional(readOnly = true)
    public List<PatientRecordItem> records(CaresyncPrincipal actor) {
        PatientIdentity patient = resolvePatient(actor);
        return jdbcTemplate.query("""
            SELECT id, file_name, content_type, size_bytes, uploaded_at
            FROM patient_documents
            WHERE tenant_id = ? AND patient_id = ?
            ORDER BY uploaded_at DESC
            LIMIT 200
            """,
            (resultSet, rowNumber) -> new PatientRecordItem(
                resultSet.getObject("id", UUID.class),
                resultSet.getString("file_name"),
                resultSet.getString("content_type"),
                resultSet.getLong("size_bytes"),
                "/api/v1/patients/" + patient.patientId() + "/documents/"
                    + resultSet.getObject("id", UUID.class) + "/content",
                instant(resultSet, "uploaded_at")
            ),
            patient.tenantId(),
            patient.patientId()
        );
    }

    private PatientIdentity resolvePatient(CaresyncPrincipal actor) {
        if (actor == null || actor.userId() == null || actor.userId().isBlank()
            || !"PATIENT".equals(actor.role()) || actor.tenantId() == null) {
            throw new ForbiddenException("An approved patient account is required");
        }
        tenantRlsContext.apply(actor, actor.tenantId());
        List<PatientIdentity> matches = jdbcTemplate.query("""
            SELECT id, tenant_id
            FROM patients
            WHERE firebase_uid = ? AND tenant_id = ? AND merged_into_patient_id IS NULL
            LIMIT 2
            """,
            (resultSet, rowNumber) -> new PatientIdentity(
                resultSet.getObject("id", UUID.class),
                resultSet.getObject("tenant_id", UUID.class)
            ),
            actor.userId(),
            actor.tenantId()
        );
        if (matches.isEmpty()) throw new NotFoundException("No patient record is linked to this account");
        if (matches.size() != 1) {
            throw new ForbiddenException("Patient account is linked to multiple records");
        }
        return matches.get(0);
    }

    private static java.time.Instant instant(ResultSet resultSet, String column) throws SQLException {
        Timestamp timestamp = resultSet.getTimestamp(column);
        return timestamp == null ? null : timestamp.toInstant();
    }

    private record PatientIdentity(UUID patientId, UUID tenantId) { }
}
