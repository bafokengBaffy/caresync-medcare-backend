package health.caresync.patient.service;

import health.caresync.common.exception.ConflictException;
import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.exception.NotFoundException;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.common.web.PageResponse;
import health.caresync.patient.domain.entity.Consent;
import health.caresync.patient.domain.entity.ConsentHistory;
import health.caresync.patient.domain.repository.ConsentRepository;
import health.caresync.patient.domain.repository.PatientConsentHistoryRepository;
import health.caresync.patient.domain.repository.PatientRepository;
import health.caresync.patient.domain.valueobject.ConsentStatus;
import health.caresync.patient.domain.valueobject.ConsentType;
import health.caresync.patient.dto.BulkOperationResponse;
import health.caresync.patient.dto.ConsentCreateRequest;
import health.caresync.patient.dto.ConsentHistoryResponse;
import health.caresync.patient.dto.ConsentResponse;
import health.caresync.patient.dto.ConsentUpdateRequest;
import health.caresync.patient.event.ConsentGrantedEvent;
import health.caresync.patient.event.ConsentRevokedEvent;
import health.caresync.patient.mapper.ConsentMapper;
import health.caresync.patient.validator.ConsentValidator;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConsentService {
    private static final int MAX_PAGE_SIZE = 100;
    private static final int EXPIRATION_BATCH_SIZE = 200;
    private static final List<String> SORT_FIELDS = List.of(
        "createdAt", "updatedAt", "grantedAt", "expiresAt", "consentType", "status"
    );

    private final ConsentRepository consentRepository;
    private final PatientConsentHistoryRepository historyRepository;
    private final PatientRepository patientRepository;
    private final TenantRlsContext tenantRlsContext;
    private final ConsentMapper mapper;
    private final ConsentValidator validator;
    private final ApplicationEventPublisher eventPublisher;
    private final Clock clock;

    public ConsentService(
        ConsentRepository consentRepository,
        PatientConsentHistoryRepository historyRepository,
        PatientRepository patientRepository,
        TenantRlsContext tenantRlsContext,
        ConsentMapper mapper,
        ConsentValidator validator,
        ApplicationEventPublisher eventPublisher,
        Clock clock
    ) {
        this.consentRepository = consentRepository;
        this.historyRepository = historyRepository;
        this.patientRepository = patientRepository;
        this.tenantRlsContext = tenantRlsContext;
        this.mapper = mapper;
        this.validator = validator;
        this.eventPublisher = eventPublisher;
        this.clock = clock;
    }

    @Transactional
    public ConsentResponse createConsent(
        UUID requestedTenantId,
        UUID patientId,
        ConsentCreateRequest request,
        String actorUserId,
        String idempotencyKey,
        String correlationId
    ) {
        UUID tenantId = requireTenant(requestedTenantId);
        requireActor(actorUserId);
        validator.validateCreate(request, clock.instant());
        requirePatient(tenantId, patientId);
        String normalizedKey = normalizeIdempotencyKey(idempotencyKey);
        String fingerprint = fingerprint(patientId, request);

        Optional<Consent> previous = consentRepository.findByTenantIdAndIdempotencyKey(tenantId, normalizedKey);
        if (previous.isPresent()) {
            Consent consent = previous.get();
            if (!Objects.equals(consent.getRequestFingerprint(), fingerprint)) {
                throw new ConflictException("The idempotency key was already used for a different request");
            }
            return mapper.toResponse(consent);
        }

        Instant now = clock.instant();
        Consent consent = new Consent();
        consent.setTenantId(tenantId);
        consent.setPatientId(patientId);
        consent.setConsentType(request.consentType());
        consent.setStatus(ConsentStatus.GRANTED);
        consent.setPurpose(request.purpose().strip());
        consent.setGrantedAt(now);
        consent.setExpiresAt(request.expiresAt());
        consent.setIdempotencyKey(normalizedKey);
        consent.setRequestFingerprint(fingerprint);
        consent.setCreatedBy(actorUserId);
        consent.setUpdatedBy(actorUserId);
        consent = consentRepository.save(consent);

        saveHistory(consent, "CREATED", null, ConsentStatus.GRANTED, null, actorUserId, correlationId, now);
        eventPublisher.publishEvent(new ConsentGrantedEvent(
            tenantId, patientId, consent.getId(), consent.getConsentType(), actorUserId, now
        ));
        return mapper.toResponse(consent);
    }

    @Transactional(readOnly = true)
    public ConsentResponse getConsent(UUID requestedTenantId, UUID patientId, UUID consentId) {
        UUID tenantId = requireTenant(requestedTenantId);
        requirePatient(tenantId, patientId);
        return mapper.toResponse(findConsent(tenantId, patientId, consentId));
    }

    @Transactional(readOnly = true)
    public PageResponse<ConsentResponse> listConsents(
        UUID requestedTenantId,
        UUID patientId,
        int page,
        int size,
        String sort,
        String consentType,
        String status,
        LocalDate from,
        LocalDate to
    ) {
        UUID tenantId = requireTenant(requestedTenantId);
        requirePatient(tenantId, patientId);
        if (page < 0 || size < 1 || size > MAX_PAGE_SIZE) {
            throw new ValidationException("Page must be non-negative and size must be between 1 and 100");
        }
        if (from != null && to != null && from.isAfter(to)) {
            throw new ValidationException("The start date must not be after the end date");
        }

        String normalizedType = null;
        if (consentType != null && !consentType.isBlank()) {
            try {
                normalizedType = new ConsentType(consentType).value();
            } catch (IllegalArgumentException exception) {
                throw new ValidationException("Consent type is invalid");
            }
        }
        ConsentStatus normalizedStatus = parseStatus(status);
        Pageable pageable = PageRequest.of(page, size, parseSort(sort));
        String selectedType = normalizedType;
        Specification<Consent> specification = (root, query, builder) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            predicates.add(builder.equal(root.get("tenantId"), tenantId));
            predicates.add(builder.equal(root.get("patientId"), patientId));
            if (selectedType != null) {
                predicates.add(builder.equal(root.get("consentType"), selectedType));
            }
            if (normalizedStatus != null) {
                predicates.add(builder.equal(root.get("status"), normalizedStatus));
            }
            if (from != null) {
                predicates.add(builder.greaterThanOrEqualTo(
                    root.get("createdAt"), from.atStartOfDay(ZoneOffset.UTC).toInstant()
                ));
            }
            if (to != null) {
                predicates.add(builder.lessThanOrEqualTo(
                    root.get("createdAt"), to.atTime(LocalTime.MAX).toInstant(ZoneOffset.UTC)
                ));
            }
            return builder.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
        Page<Consent> results = consentRepository.findAll(specification, pageable);
        List<ConsentResponse> content = results.getContent().stream().map(mapper::toResponse).toList();
        return new PageResponse<>(content, results.getNumber(), results.getSize(), results.getTotalElements());
    }

    @Transactional
    public ConsentResponse updateConsent(
        UUID requestedTenantId,
        UUID patientId,
        UUID consentId,
        ConsentUpdateRequest request,
        String actorUserId,
        String correlationId
    ) {
        UUID tenantId = requireTenant(requestedTenantId);
        requireActor(actorUserId);
        validator.validateUpdate(request, clock.instant());
        Consent consent = findConsent(tenantId, patientId, consentId);
        if (consent.getStatus() != ConsentStatus.GRANTED) {
            throw new ConflictException("Only a granted consent can be updated");
        }
        if (request.purpose() != null) {
            consent.setPurpose(request.purpose().strip());
        }
        if (request.expiresAt() != null) {
            consent.setExpiresAt(request.expiresAt());
        }
        consent.setUpdatedBy(actorUserId);
        consent = consentRepository.save(consent);
        saveHistory(
            consent, "UPDATED", ConsentStatus.GRANTED, ConsentStatus.GRANTED,
            null, actorUserId, correlationId, clock.instant()
        );
        return mapper.toResponse(consent);
    }

    @Transactional
    public ConsentResponse revokeConsent(
        UUID requestedTenantId,
        UUID patientId,
        UUID consentId,
        String reason,
        String actorUserId,
        String correlationId
    ) {
        UUID tenantId = requireTenant(requestedTenantId);
        requireActor(actorUserId);
        if (reason == null || reason.isBlank() || reason.length() > 1000) {
            throw new ValidationException("A revocation reason of at most 1000 characters is required");
        }
        Consent consent = findConsent(tenantId, patientId, consentId);
        if (consent.getStatus() != ConsentStatus.GRANTED) {
            throw new ConflictException("Only a granted consent can be revoked");
        }

        Instant now = clock.instant();
        consent.setStatus(ConsentStatus.REVOKED);
        consent.setRevokedAt(now);
        consent.setRevocationReason(reason.strip());
        consent.setUpdatedBy(actorUserId);
        consent = consentRepository.save(consent);
        saveHistory(
            consent, "REVOKED", ConsentStatus.GRANTED, ConsentStatus.REVOKED,
            reason.strip(), actorUserId, correlationId, now
        );
        eventPublisher.publishEvent(new ConsentRevokedEvent(
            tenantId, patientId, consent.getId(), consent.getConsentType(), actorUserId, now
        ));
        return mapper.toResponse(consent);
    }

    @Transactional(readOnly = true)
    public List<ConsentHistoryResponse> getConsentHistory(
        UUID requestedTenantId,
        UUID patientId,
        UUID consentId
    ) {
        UUID tenantId = requireTenant(requestedTenantId);
        findConsent(tenantId, patientId, consentId);
        return historyRepository.findAllByTenantIdAndConsentIdOrderByOccurredAtDesc(tenantId, consentId)
            .stream()
            .map(mapper::toHistoryResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public Optional<ConsentResponse> findActiveConsent(
        UUID requestedTenantId,
        UUID patientId,
        String consentType
    ) {
        UUID tenantId = requireTenant(requestedTenantId);
        requirePatient(tenantId, patientId);
        String normalizedType;
        try {
            normalizedType = new ConsentType(consentType).value();
        } catch (IllegalArgumentException exception) {
            throw new ValidationException("Consent type is invalid");
        }
        Instant now = clock.instant();
        return consentRepository.findAllByTenantIdAndPatientIdAndConsentTypeAndStatusOrderByGrantedAtDesc(
                tenantId, patientId, normalizedType, ConsentStatus.GRANTED
            ).stream()
            .filter(consent -> consent.getExpiresAt() == null || consent.getExpiresAt().isAfter(now))
            .findFirst()
            .map(mapper::toResponse);
    }

    @Transactional
    public BulkOperationResponse expireConsents(
        UUID requestedTenantId,
        LocalDate asOf,
        String actorUserId,
        String correlationId
    ) {
        UUID tenantId = requireTenant(requestedTenantId);
        requireActor(actorUserId);
        if (asOf == null || asOf.isAfter(LocalDate.now(clock))) {
            throw new ValidationException("The expiry date must not be in the future");
        }
        Instant cutoff = asOf.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        int affected = 0;
        while (true) {
            List<Consent> batch = consentRepository.findAllByTenantIdAndStatusAndExpiresAtLessThan(
                tenantId,
                ConsentStatus.GRANTED,
                cutoff,
                PageRequest.of(0, EXPIRATION_BATCH_SIZE, Sort.by("id").ascending())
            );
            if (batch.isEmpty()) {
                break;
            }
            Instant now = clock.instant();
            for (Consent consent : batch) {
                consent.setStatus(ConsentStatus.EXPIRED);
                consent.setUpdatedBy(actorUserId);
            }
            consentRepository.saveAll(batch);
            for (Consent consent : batch) {
                saveHistory(
                    consent, "EXPIRED", ConsentStatus.GRANTED, ConsentStatus.EXPIRED,
                    null, actorUserId, correlationId, now
                );
            }
            affected += batch.size();
        }
        return new BulkOperationResponse(affected, asOf);
    }

    private UUID requireTenant(UUID requestedTenantId) {
        UUID authenticatedTenantId = tenantRlsContext.apply();
        if (!Objects.equals(authenticatedTenantId, requestedTenantId)) {
            throw new ForbiddenException("Tenant access denied");
        }
        return authenticatedTenantId;
    }

    private void requirePatient(UUID tenantId, UUID patientId) {
        if (patientId == null || !patientRepository.existsByIdAndTenantId(patientId, tenantId)) {
            throw new NotFoundException("Patient not found");
        }
    }

    private Consent findConsent(UUID tenantId, UUID patientId, UUID consentId) {
        return consentRepository.findByIdAndTenantIdAndPatientId(consentId, tenantId, patientId)
            .orElseThrow(() -> new NotFoundException("Consent not found"));
    }

    private void requireActor(String actorUserId) {
        if (actorUserId == null || actorUserId.isBlank() || actorUserId.length() > 128) {
            throw new ForbiddenException("Authenticated user is required");
        }
    }

    private String normalizeIdempotencyKey(String key) {
        if (key == null || key.isBlank() || key.length() > 128 || key.chars().anyMatch(Character::isISOControl)) {
            throw new ValidationException("A valid idempotency key of at most 128 characters is required");
        }
        return key.strip();
    }

    private String fingerprint(UUID patientId, ConsentCreateRequest request) {
        String value = patientId + "\n" + request.consentType() + "\n" + request.purpose().strip()
            + "\n" + request.expiresAt();
        try {
            return HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))
            );
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private void saveHistory(
        Consent consent,
        String action,
        ConsentStatus previousStatus,
        ConsentStatus newStatus,
        String reason,
        String actorUserId,
        String correlationId,
        Instant occurredAt
    ) {
        historyRepository.save(new ConsentHistory(
            consent.getTenantId(),
            consent.getId(),
            action,
            previousStatus == null ? null : previousStatus.name(),
            newStatus == null ? null : newStatus.name(),
            reason,
            actorUserId,
            correlationId,
            occurredAt
        ));
    }

    private ConsentStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        try {
            return ConsentStatus.valueOf(status.strip().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ValidationException("Consent status is invalid");
        }
    }

    private Sort parseSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        String[] parts = sort.split(",", -1);
        String property = parts[0].strip();
        if (!SORT_FIELDS.contains(property) || parts.length > 2) {
            throw new ValidationException("Consent sort field is invalid");
        }
        Sort.Direction direction = Sort.Direction.DESC;
        if (parts.length == 2) {
            try {
                direction = Sort.Direction.fromString(parts[1].strip());
            } catch (IllegalArgumentException exception) {
                throw new ValidationException("Consent sort direction is invalid");
            }
        }
        return Sort.by(direction, property);
    }
}