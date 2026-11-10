package health.caresync.clinical.service;

import health.caresync.clinical.domain.Appointment;
import health.caresync.clinical.domain.AppointmentRepository;
import health.caresync.clinical.domain.AppointmentStatus;
import health.caresync.clinical.dto.ClinicalNoteCreateRequest;
import health.caresync.clinical.dto.ClinicalNoteResponse;
import health.caresync.clinical.dto.ClinicalNoteSummary;
import health.caresync.clinical.dto.SoapDataResponse;
import health.caresync.clinical.notes.ClinicalNoteStore;
import health.caresync.common.dto.Specialty;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.common.web.PageResponse;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ClinicalNoteService {
    private static final int MAX_PAGE_SIZE = 100;

    private final AppointmentRepository appointments;
    private final JdbcTemplate jdbcTemplate;
    private final TenantRlsContext tenantRlsContext;
    private final ObjectProvider<ClinicalNoteStore> noteStores;

    public ClinicalNoteService(
        AppointmentRepository appointments,
        JdbcTemplate jdbcTemplate,
        TenantRlsContext tenantRlsContext,
        ObjectProvider<ClinicalNoteStore> noteStores
    ) {
        this.appointments = appointments;
        this.jdbcTemplate = jdbcTemplate;
        this.tenantRlsContext = tenantRlsContext;
        this.noteStores = noteStores;
    }

    public ClinicalNoteResponse create(ClinicalNoteCreateRequest request) {
        UUID tenantId = tenantRlsContext.apply();
        CaresyncPrincipal principal = requirePrincipal();
        UUID providerId = providerIdFor(principal, tenantId);
        if (providerId != null && !providerId.equals(request.providerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Provider cannot create notes for another provider");
        }

        Appointment appointment = appointments.findByIdAndTenantId(request.appointmentId(), tenantId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found"));
        if (appointment.getPatientId() == null
            || !appointment.getPatientId().equals(request.patientId())
            || !appointment.getProviderId().equals(request.providerId())
            || appointment.getStatus() == AppointmentStatus.CANCELLED
            || appointment.getStatus() == AppointmentStatus.NO_SHOW) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Clinical note does not match an active appointment");
        }

        Map<String, Object> soapData = new HashMap<>();
        soapData.put("subjective", request.soapData().subjective());
        soapData.put("objective", request.soapData().objective());
        soapData.put("assessment", request.soapData().assessment());
        soapData.put("plan", request.soapData().plan());

        Map<String, Object> note = new HashMap<>();
        note.put("tenant_id", tenantId.toString());
        note.put("patient_id", request.patientId().toString());
        note.put("provider_id", request.providerId().toString());
        note.put("appointment_id", request.appointmentId().toString());
        note.put("specialty", request.specialty().name());
        note.put("note_type", request.noteType().trim());
        note.put("status", "DRAFT");
        note.put("soap_data", soapData);
        note.put("created_at", Instant.now().toString());

        ClinicalNoteStore store = requireStore();
        String noteId = store.create(note);
        note.put("id", noteId);
        return response(note);
    }

    public PageResponse<ClinicalNoteSummary> list(int page, int size, String query) {
        return listForPatient(null, page, size, query);
    }

    public PageResponse<ClinicalNoteSummary> listForPatient(
        UUID patientId,
        int page,
        int size,
        String query
    ) {
        validatePage(page, size);
        UUID tenantId = tenantRlsContext.apply();
        CaresyncPrincipal principal = requirePrincipal();
        UUID providerId = providerIdFor(principal, tenantId);
        String search = query == null ? "" : query.trim().toLowerCase();

        List<Map<String, Object>> filtered = new ArrayList<>();
        for (Map<String, Object> note : requireStore().findByTenantId(tenantId.toString())) {
            if (!tenantId.toString().equals(stringValue(note.get("tenant_id")))) {
                continue;
            }
            if (patientId != null && !patientId.equals(uuidValue(note.get("patient_id")))) {
                continue;
            }
            if (providerId != null && !providerId.equals(uuidValue(note.get("provider_id")))) {
                continue;
            }
            if (!search.isEmpty()
                && !stringValue(note.get("note_type")).toLowerCase().contains(search)
                && !stringValue(note.get("specialty")).toLowerCase().contains(search)
                && !stringValue(note.get("status")).toLowerCase().contains(search)) {
                continue;
            }
            filtered.add(note);
        }

        filtered.sort(Comparator.comparing(
            (Map<String, Object> note) -> instantValue(note.get("created_at")),
            Comparator.nullsLast(Comparator.reverseOrder())
        ));
        int fromIndex = (int) Math.min((long) page * size, filtered.size());
        int toIndex = Math.min(fromIndex + size, filtered.size());
        List<ClinicalNoteSummary> content = filtered.subList(fromIndex, toIndex).stream()
            .map(this::summary)
            .toList();
        return new PageResponse<>(content, page, size, filtered.size());
    }

    public ClinicalNoteResponse get(String id) {
        UUID tenantId = tenantRlsContext.apply();
        CaresyncPrincipal principal = requirePrincipal();
        UUID providerId = providerIdFor(principal, tenantId);
        Map<String, Object> stored = requireStore().findById(id);
        if (stored == null || !tenantId.toString().equals(stringValue(stored.get("tenant_id")))) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Clinical note not found");
        }
        Map<String, Object> note = new HashMap<>(stored);
        if (providerId != null && !providerId.equals(uuidValue(note.get("provider_id")))) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Clinical note not found");
        }
        note.putIfAbsent("id", id);
        return response(note);
    }

    private UUID providerIdFor(CaresyncPrincipal principal, UUID tenantId) {
        if (!"PROVIDER".equals(principal.role())) {
            return null;
        }
        try {
            return jdbcTemplate.queryForObject(
                "SELECT id FROM providers WHERE tenant_id = ? AND user_id = ? AND is_active = TRUE",
                UUID.class,
                tenantId,
                principal.userId()
            );
        } catch (EmptyResultDataAccessException exception) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Active provider profile is required");
        }
    }

    private CaresyncPrincipal requirePrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CaresyncPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user is required");
        }
        return principal;
    }

    private ClinicalNoteStore requireStore() {
        ClinicalNoteStore store = noteStores.getIfAvailable();
        if (store == null) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Clinical note storage is not configured"
            );
        }
        return store;
    }

    private void validatePage(int page, int size) {
        if (page < 0 || size < 1 || size > MAX_PAGE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid page or page size");
        }
    }

    private ClinicalNoteSummary summary(Map<String, Object> note) {
        return new ClinicalNoteSummary(
            stringValue(note.get("id")),
            uuidValue(note.get("patient_id")),
            uuidValue(note.get("provider_id")),
            uuidValue(note.get("appointment_id")),
            specialtyValue(note.get("specialty")),
            stringValue(note.get("note_type")),
            stringValue(note.get("status")),
            instantValue(note.get("created_at"))
        );
    }

    private ClinicalNoteResponse response(Map<String, Object> note) {
        Object value = note.get("soap_data");
        if (!(value instanceof Map<?, ?> soap)) {
            throw new IllegalStateException("Clinical note has invalid SOAP data");
        }
        return new ClinicalNoteResponse(
            stringValue(note.get("id")),
            uuidValue(note.get("patient_id")),
            uuidValue(note.get("provider_id")),
            uuidValue(note.get("appointment_id")),
            specialtyValue(note.get("specialty")),
            stringValue(note.get("note_type")),
            stringValue(note.get("status")),
            instantValue(note.get("created_at")),
            new SoapDataResponse(
                stringValue(soap.get("subjective")),
                stringValue(soap.get("objective")),
                stringValue(soap.get("assessment")),
                stringValue(soap.get("plan"))
            )
        );
    }

    private Specialty specialtyValue(Object value) {
        return value instanceof Specialty specialty ? specialty : Specialty.valueOf(stringValue(value));
    }

    private UUID uuidValue(Object value) {
        if (value instanceof UUID uuid) {
            return uuid;
        }
        return value == null ? null : UUID.fromString(value.toString());
    }

    private Instant instantValue(Object value) {
        if (value instanceof Instant instant) {
            return instant;
        }
        if (value instanceof Date date) {
            return date.toInstant();
        }
        if (value instanceof com.google.cloud.Timestamp timestamp) {
            return timestamp.toDate().toInstant();
        }
        return value == null ? null : Instant.parse(value.toString());
    }

    private String stringValue(Object value) {
        return value == null ? "" : value.toString();
    }
}
