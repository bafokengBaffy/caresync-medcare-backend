package health.caresync.clinical.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import health.caresync.clinical.domain.AppointmentRepository;
import health.caresync.clinical.dto.ClinicalNoteResponse;
import health.caresync.clinical.dto.ClinicalNoteSummary;
import health.caresync.clinical.notes.ClinicalNoteStore;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.common.web.PageResponse;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

class ClinicalNoteServiceTest {
    private final AppointmentRepository appointments = mock(AppointmentRepository.class);
    private final JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
    private final TenantRlsContext tenantRlsContext = mock(TenantRlsContext.class);
    private final ObjectProvider<ClinicalNoteStore> noteStores = mockProvider();

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void listsTenantNotesWithSearchAndPagination() {
        UUID tenantId = UUID.randomUUID();
        String noteId = "note-1";
        ClinicalNoteStore store = mock(ClinicalNoteStore.class);
        when(tenantRlsContext.apply()).thenReturn(tenantId);
        when(noteStores.getIfAvailable()).thenReturn(store);
        when(store.findByTenantId(tenantId.toString())).thenReturn(List.of(
            storedNote(noteId, tenantId, "SOAP_NOTE", "2026-10-26T00:00:00Z"),
            storedNote("note-2", tenantId, "PROGRESS_NOTE", "2026-10-25T00:00:00Z")
        ));
        authenticateAsAdmin(tenantId);

        ClinicalNoteService service = new ClinicalNoteService(
            appointments, jdbcTemplate, tenantRlsContext, noteStores
        );
        PageResponse<ClinicalNoteSummary> page = service.list(0, 1, "SOAP");

        assertEquals(1, page.content().size());
        assertEquals(1, page.total());
        assertEquals(noteId, page.content().get(0).id());
        assertEquals("SOAP_NOTE", page.content().get(0).noteType());
        verify(store).findByTenantId(tenantId.toString());
    }

    @Test
    void returnsSoapDataForAnAuthorizedNote() {
        UUID tenantId = UUID.randomUUID();
        String noteId = "note-1";
        ClinicalNoteStore store = mock(ClinicalNoteStore.class);
        when(tenantRlsContext.apply()).thenReturn(tenantId);
        when(noteStores.getIfAvailable()).thenReturn(store);
        when(store.findById(noteId)).thenReturn(storedNote(
            noteId, tenantId, "SOAP_NOTE", "2026-10-26T00:00:00Z"
        ));
        authenticateAsAdmin(tenantId);

        ClinicalNoteService service = new ClinicalNoteService(
            appointments, jdbcTemplate, tenantRlsContext, noteStores
        );
        ClinicalNoteResponse response = service.get(noteId);

        assertEquals("Subjective details", response.soapData().subjective());
        assertEquals("Objective details", response.soapData().objective());
        assertEquals("Assessment details", response.soapData().assessment());
        assertEquals("Plan details", response.soapData().plan());
    }

    private void authenticateAsAdmin(UUID tenantId) {
        CaresyncPrincipal principal = new CaresyncPrincipal(
            "admin-user", tenantId, "ADMIN", null, "admin@example.test"
        );
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(
                principal,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
            )
        );
    }

    @SuppressWarnings("unchecked")
    private static ObjectProvider<ClinicalNoteStore> mockProvider() {
        return mock(ObjectProvider.class);
    }

    private Map<String, Object> storedNote(String id, UUID tenantId, String noteType, String createdAt) {
        return Map.of(
            "id", id,
            "tenant_id", tenantId.toString(),
            "patient_id", UUID.randomUUID().toString(),
            "provider_id", UUID.randomUUID().toString(),
            "appointment_id", UUID.randomUUID().toString(),
            "specialty", "DENTAL",
            "note_type", noteType,
            "status", "DRAFT",
            "soap_data", Map.of(
                "subjective", "Subjective details",
                "objective", "Objective details",
                "assessment", "Assessment details",
                "plan", "Plan details"
            ),
            "created_at", Instant.parse(createdAt).toString()
        );
    }
}
