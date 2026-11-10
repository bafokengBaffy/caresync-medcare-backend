package health.caresync.patient.service;

import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.exception.NotFoundException;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.common.web.PageResponse;
import health.caresync.patient.domain.entity.Patient;
import health.caresync.patient.domain.entity.PatientReferral;
import health.caresync.patient.domain.repository.PatientReferralRepository;
import health.caresync.patient.domain.repository.PatientRepository;
import health.caresync.patient.dto.PatientReferralCreateRequest;
import health.caresync.patient.dto.PatientReferralResponse;
import health.caresync.patient.dto.PatientReferralStatusRequest;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PatientReferralService {
    private static final Set<String> TRANSITIONS_FROM_PENDING = Set.of("SENT", "CANCELLED");
    private static final Set<String> TRANSITIONS_FROM_SENT = Set.of("ACCEPTED", "DECLINED", "CANCELLED");
    private static final Set<String> TRANSITIONS_FROM_ACCEPTED = Set.of("COMPLETED", "CANCELLED");

    private final PatientReferralRepository referralRepository;
    private final PatientRepository patientRepository;
    private final TenantRlsContext tenantRlsContext;
    private final AuditService auditService;

    public PatientReferralService(
        PatientReferralRepository referralRepository,
        PatientRepository patientRepository,
        TenantRlsContext tenantRlsContext,
        AuditService auditService
    ) {
        this.referralRepository = referralRepository;
        this.patientRepository = patientRepository;
        this.tenantRlsContext = tenantRlsContext;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public PageResponse<PatientReferralResponse> list(UUID patientId, int page, int size) {
        UUID tenantId = requireTenant();
        requirePatient(tenantId, patientId);
        validatePage(page, size);
        Page<PatientReferral> referrals = referralRepository.findAllByTenantIdAndPatientId(
            tenantId,
            patientId,
            PageRequest.of(page, size, Sort.by("createdAt").descending())
        );
        return new PageResponse<>(
            referrals.getContent().stream().map(this::toResponse).toList(),
            referrals.getNumber(),
            referrals.getSize(),
            referrals.getTotalElements()
        );
    }

    @Transactional
    public PatientReferralResponse create(
        UUID patientId,
        PatientReferralCreateRequest request,
        CaresyncPrincipal actor,
        HttpServletRequest servletRequest
    ) {
        UUID tenantId = requireTenant();
        requirePatient(tenantId, patientId);
        if (actor == null || actor.userId() == null || actor.userId().isBlank()) {
            throw new ForbiddenException("Authenticated actor required");
        }
        PatientReferral referral = referralRepository.save(new PatientReferral(
            tenantId,
            patientId,
            request.referralType(),
            request.recipientName().trim(),
            normalizeOptional(request.recipientOrganization()),
            request.reason().trim(),
            normalizeOptional(request.notes()),
            actor.userId()
        ));
        auditService.recordAdministrativeAction(
            actor, tenantId, "PATIENT_REFERRAL_CREATED", "PATIENT_REFERRAL", referral.getId().toString(), servletRequest
        );
        return toResponse(referral);
    }

    @Transactional
    public PatientReferralResponse updateStatus(
        UUID patientId,
        UUID referralId,
        PatientReferralStatusRequest request,
        CaresyncPrincipal actor,
        HttpServletRequest servletRequest
    ) {
        UUID tenantId = requireTenant();
        requirePatient(tenantId, patientId);
        if (actor == null || actor.userId() == null || actor.userId().isBlank()) {
            throw new ForbiddenException("Authenticated actor required");
        }
        PatientReferral referral = referralRepository.findByIdAndTenantIdAndPatientId(referralId, tenantId, patientId)
            .orElseThrow(() -> new NotFoundException("Patient referral not found"));
        if (!allowedTransition(referral.getStatus(), request.status())) {
            throw new ValidationException("The referral status transition is not allowed");
        }
        referral.updateStatus(request.status(), normalizeOptional(request.notes()), actor.userId());
        PatientReferral saved = referralRepository.save(referral);
        auditService.recordAdministrativeAction(
            actor,
            tenantId,
            "PATIENT_REFERRAL_STATUS_UPDATED",
            "PATIENT_REFERRAL",
            saved.getId().toString(),
            servletRequest
        );
        return toResponse(saved);
    }

    private UUID requireTenant() {
        UUID tenantId = tenantRlsContext.apply();
        if (tenantId == null) throw new ForbiddenException("Tenant access denied");
        return tenantId;
    }

    private void requirePatient(UUID tenantId, UUID patientId) {
        Patient patient = patientRepository.findByIdAndTenantIdAndMergedIntoPatientIdIsNull(patientId, tenantId)
            .orElseThrow(() -> new NotFoundException("Patient not found"));
        if (!Objects.equals(patient.getTenantId(), tenantId)) {
            throw new ForbiddenException("Tenant access denied");
        }
    }

    private static boolean allowedTransition(String current, String next) {
        return switch (current) {
            case "PENDING" -> TRANSITIONS_FROM_PENDING.contains(next);
            case "SENT" -> TRANSITIONS_FROM_SENT.contains(next);
            case "ACCEPTED" -> TRANSITIONS_FROM_ACCEPTED.contains(next);
            default -> false;
        };
    }

    private PatientReferralResponse toResponse(PatientReferral referral) {
        return new PatientReferralResponse(
            referral.getId(),
            referral.getPatientId(),
            referral.getReferralType(),
            referral.getRecipientName(),
            referral.getRecipientOrganization(),
            referral.getReason(),
            referral.getNotes(),
            referral.getStatus(),
            referral.getCreatedBy(),
            referral.getUpdatedBy(),
            referral.getCreatedAt(),
            referral.getUpdatedAt()
        );
    }

    private static String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static void validatePage(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ValidationException("Page must be non-negative and size must be between 1 and 100");
        }
    }
}
