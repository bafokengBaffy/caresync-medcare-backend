package health.caresync.clinical.service;

import health.caresync.clinical.domain.Appointment;
import health.caresync.clinical.domain.AppointmentRepository;
import health.caresync.clinical.dto.ClinicalNoteCreateRequest;
import health.caresync.clinical.dto.ClinicalNoteResponse;
import health.caresync.clinical.dto.ClinicalNoteSummary;
import health.caresync.clinical.dto.SoapDataResponse;
import health.caresync.clinical.notes.ClinicalNoteStore;
import health.caresync.common.dto.Specialty;
import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.exception.NotFoundException;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.common.web.PageResponse;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class ClinicalNoteService {
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

    @Transactional
    public ClinicalNoteResponse create(ClinicalNoteCreateRequest request) {
        UUID tenantId = tenantRlsContext.apply();
        CaresyncPrincipal principal = currentPrincipal();
        if (!request.specialty().name().equals(principal.specialty())
            && !"ADMIN".equals(principal.role())) {
            throw new ForbiddenException("Provider specialty does not permit this note");
        }

        Boolean providerMatches = jdbcTemplate.query(
            "select specialty, user_id, is_active from providers where tenant_id = ? and id = ?",
            resultSet -> resultSet.next()
                && request.specialty().name().equals(resultSet.getString("specialty"))
                && resultSet.getBoolean("is_active")
                && ("ADMIN".equals(principal.role())
                    || principal.userId().equals(resultSet.getString("user_id"))),
            tenantId,
            request.providerId()
        );
        if (!Boolean.TRUE.equals(providerMatches)) {
            throw new ForbiddenException("Provider is not authorized for this tenant or specialty");
        }

        Appointment appointment = appointments.findByIdAndTenantId(request.appointmentId(), tenantId)
            .orElseThrow(() -> new NotFoundException("Appointment not found"));
        if (!appointment.getPatientId().equals(request.patientId())
            || !appointment.getProviderId().equals(request.providerId())) {
            throw new ForbiddenException("Note does not match the scheduled appointment");
        }
        if (appointment.getStatus() != health.caresync.clinical.domain.AppointmentStatus.COMPLETED) {
            throw new ValidationException("Clinical notes can only be created for completed appointments");
        }

        ClinicalNoteStore store = requireStore();
        Instant createdAt = Instant.now();
        Map<String, Object> note = Map.of(
            "tenant_id", tenantId.toString(),
            "patient_id", request.patientId().toString(),
            "provider_id", request.providerId().toString(),
            "appointment_id", request.appointmentId().toString(),
            "specialty", request.specialty().name(),
            "note_type", request.noteType(),
            "status", "DRAFT",
            "soap_data", Map.of(
                "subjective", request.soapData().subjective(),
                "objective", request.soapData().objective(),
                "assessment", request.soapData().assessment(),
                "plan", request.soapData().plan()
            ),
            "created_at", createdAt.toString()
        );
        String id = store.create(note);
        return new ClinicalNoteResponse(
            id, request.patientId(), request.providerId(), request.appointmentId(),
            request.specialty(), request.noteType(), "DRAFT", createdAt,
            new SoapDataResponse(
                request.soapData().subjective(),
                request.soapData().objective(),
                request.soapData().assessment(),
                request.soapData().plan()
            )
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<ClinicalNoteSummary> list(int page, int size, String search) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ValidationException("Page must be non-negative and size must be between 1 and 100");
        }
        UUID tenantId = tenantRlsContext.apply();
        CaresyncPrincipal principal = currentPrincipal();
        String query = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        List<ClinicalNoteSummary> matches = requireStore().findByTenantId(tenantId.toString()).stream()
            .filter(note -> canAccess(note, tenantId, principal))
            .filter(note -> matchesSearch(note, query))
            .map(note -> toSummary((String) note.get("id"), note))
            .sorted(Comparator.comparing(ClinicalNoteSummary::createdAt).reversed())
            .toList();

        long offset = (long) page * size;
        int from = (int) Math.min(offset, matches.size());
        int to = Math.min(from + size, matches.size());
        return new PageResponse<>(matches.subList(from, to), page, size, matches.size());
    }

    private ClinicalNoteSummary toSummary(String id, Map<String, Object> note) {
        try {
            return new ClinicalNoteSummary(
                id,
                UUID.fromString((String) note.get("patient_id")),
                UUID.fromString((String) note.get("provider_id")),
                UUID.fromString((String) note.get("appointment_id")),
                Specialty.valueOf((String) note.get("specialty")),
                (String) note.get("note_type"),
                (String) note.get("status"),
                Instant.parse((String) note.get("created_at"))
            );
        } catch (IllegalArgumentException | ClassCastException e) {
            throw new IllegalStateException("Stored clinical note has an invalid shape", e);
        }
    }

    @Transactional(readOnly = true)
    public ClinicalNoteResponse get(String id) {
        UUID tenantId = tenantRlsContext.apply();
        CaresyncPrincipal principal = currentPrincipal();
        Map<String, Object> note = requireStore().findById(id);
        if (note == null || !tenantId.toString().equals(note.get("tenant_id"))) {
            throw new NotFoundException("Clinical note not found");
        }
        if (!canAccess(note, tenantId, principal)) {
            throw new ForbiddenException("Clinical note is not available to this user");
        }
        return toResponse(id, note);
    }

    private ClinicalNoteResponse toResponse(String id, Map<String, Object> note) {
        try {
            return new ClinicalNoteResponse(
                id,
                UUID.fromString((String) note.get("patient_id")),
                UUID.fromString((String) note.get("provider_id")),
                UUID.fromString((String) note.get("appointment_id")),
                Specialty.valueOf((String) note.get("specialty")),
                (String) note.get("note_type"),
                (String) note.get("status"),
                Instant.parse((String) note.get("created_at")),
                soapData(note.get("soap_data"))
            );
        } catch (IllegalArgumentException | ClassCastException e) {
            throw new IllegalStateException("Stored clinical note has an invalid shape", e);
        }
    }

    private boolean canAccess(Map<String, Object> note, UUID tenantId, CaresyncPrincipal principal) {
        return "ADMIN".equals(principal.role())
            || ("PROVIDER".equals(principal.role())
                && principal.specialty() != null
                && principal.specialty().equals(note.get("specialty"))
                && providerBelongsToUser(tenantId, note.get("provider_id"), principal.userId()));
    }

    private boolean matchesSearch(Map<String, Object> note, String query) {
        if (query.isEmpty()) {
            return true;
        }
        return List.of("id", "patient_id", "provider_id", "appointment_id", "specialty", "note_type", "status")
            .stream()
            .map(note::get)
            .filter(String.class::isInstance)
            .map(String.class::cast)
            .anyMatch(value -> value.toLowerCase(Locale.ROOT).contains(query));
    }

    private SoapDataResponse soapData(Object value) {
        if (!(value instanceof Map<?, ?> soap)) {
            throw new IllegalStateException("Stored clinical note has invalid SOAP data");
        }
        try {
            return new SoapDataResponse(
                requiredString(soap, "subjective"),
                requiredString(soap, "objective"),
                requiredString(soap, "assessment"),
                requiredString(soap, "plan")
            );
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("Stored clinical note has invalid SOAP data", e);
        }
    }

    private String requiredString(Map<?, ?> map, String key) {
        Object value = map.get(key);
        if (!(value instanceof String text)) {
            throw new IllegalArgumentException("Missing SOAP field: " + key);
        }
        return text;
    }

    private boolean providerBelongsToUser(UUID tenantId, Object providerId, String userId) {
        if (!(providerId instanceof String value)) {
            return false;
        }
        return Boolean.TRUE.equals(jdbcTemplate.query(
            "select exists(select 1 from providers where tenant_id = ? and id = ? and user_id = ? and is_active)",
            resultSet -> resultSet.next() && resultSet.getBoolean(1),
            tenantId,
            UUID.fromString(value),
            userId
        ));
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

    private static CaresyncPrincipal currentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CaresyncPrincipal principal)) {
            throw new ForbiddenException("Authenticated CareSync user required");
        }
        return principal;
    }
}
