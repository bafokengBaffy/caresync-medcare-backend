package health.caresync.patient.service;

import health.caresync.common.exception.ConflictException;
import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.exception.NotFoundException;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.common.web.PageResponse;
import health.caresync.patient.domain.entity.Patient;
import health.caresync.patient.domain.entity.PatientMergeLog;
import health.caresync.patient.domain.repository.PatientMergeLogRepository;
import health.caresync.patient.domain.repository.PatientRepository;
import health.caresync.patient.domain.valueobject.MergeStatus;
import health.caresync.patient.dto.DuplicateSuggestion;
import health.caresync.patient.dto.MergeStatisticsResponse;
import health.caresync.patient.dto.PatientMergeRequest;
import health.caresync.patient.dto.PatientMergeResponse;
import health.caresync.patient.event.PatientMergedEvent;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PatientMergeService {
    private static final int MAX_PAGE_SIZE = 100;
    private static final int DUPLICATE_SCAN_LIMIT = 500;
    private static final Set<String> SORT_FIELDS =
        Set.of("requestedAt", "confirmedAt", "status", "sourcePatientId", "targetPatientId");
    private static final Set<String> PRIVILEGED_ROLES =
        Set.of("ADMIN", "MANAGER", "PRIVACY_OFFICER", "MERGE_MANAGER");

    private final PatientRepository patientRepository;
    private final PatientMergeLogRepository mergeRepository;
    private final TenantRlsContext tenantRlsContext;
    private final ApplicationEventPublisher eventPublisher;
    private final Clock clock;

    public PatientMergeService(
        PatientRepository patientRepository,
        PatientMergeLogRepository mergeRepository,
        TenantRlsContext tenantRlsContext,
        ApplicationEventPublisher eventPublisher,
        Clock clock
    ) {
        this.patientRepository = patientRepository;
        this.mergeRepository = mergeRepository;
        this.tenantRlsContext = tenantRlsContext;
        this.eventPublisher = eventPublisher;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PageResponse<DuplicateSuggestion> suggestDuplicates(
        UUID requestedTenantId,
        int page,
        int size,
        double minScore
    ) {
        UUID tenantId = requireTenant(requestedTenantId);
        validatePage(page, size);
        if (!Double.isFinite(minScore) || minScore < 0.0 || minScore > 1.0) {
            throw new ValidationException("Minimum match score must be between 0 and 1");
        }

        List<Patient> candidates = patientRepository.findAllByTenantIdAndMergedIntoPatientIdIsNull(
            tenantId, PageRequest.of(0, DUPLICATE_SCAN_LIMIT, Sort.by("id").ascending())
        ).getContent();
        List<DuplicateSuggestion> matches = new ArrayList<>();
        for (int left = 0; left < candidates.size(); left++) {
            Patient first = candidates.get(left);
            for (int right = left + 1; right < candidates.size(); right++) {
                Patient second = candidates.get(right);
                double score = similarity(first, second);
                if (score >= minScore) {
                    matches.add(new DuplicateSuggestion(
                        first.getId(),
                        displayName(first),
                        second.getId(),
                        displayName(second),
                        score,
                        matchReason(first, second)
                    ));
                }
            }
        }
        int from = Math.min(page * size, matches.size());
        int to = Math.min(from + size, matches.size());
        return new PageResponse<>(matches.subList(from, to), page, size, matches.size());
    }

    @Transactional
    public PatientMergeResponse requestMerge(
        UUID requestedTenantId,
        PatientMergeRequest request,
        String actorUserId,
        String correlationId
    ) {
        UUID tenantId = requireTenant(requestedTenantId);
        requireActor(actorUserId);
        if (request == null || request.sourcePatientId() == null || request.targetPatientId() == null) {
            throw new ValidationException("Source and target patients are required");
        }
        if (request.sourcePatientId().equals(request.targetPatientId())) {
            throw new ValidationException("A patient cannot be merged into itself");
        }
        if (request.reason() == null || request.reason().isBlank() || request.reason().length() > 1000) {
            throw new ValidationException("A reason of at most 1000 characters is required");
        }
        Patient source = requireActivePatient(tenantId, request.sourcePatientId());
        requireActivePatient(tenantId, request.targetPatientId());
        if (mergeRepository.existsByTenantIdAndSourcePatientIdAndTargetPatientIdAndStatus(
                tenantId, source.getId(), request.targetPatientId(), MergeStatus.PENDING
            ) || mergeRepository.existsByTenantIdAndSourcePatientIdAndTargetPatientIdAndStatus(
                tenantId, request.targetPatientId(), source.getId(), MergeStatus.PENDING
            )) {
            throw new ConflictException("A merge request for this patient pair is already pending");
        }

        PatientMergeLog merge = new PatientMergeLog();
        merge.setTenantId(tenantId);
        merge.setSourcePatientId(source.getId());
        merge.setTargetPatientId(request.targetPatientId());
        merge.setStatus(MergeStatus.PENDING);
        merge.setRequesterUserId(actorUserId);
        merge.setRequestReason(request.reason().strip());
        merge.setCorrelationId(correlationId);
        merge.setRequestedAt(clock.instant());
        return toResponse(mergeRepository.save(merge));
    }

    @Transactional
    public PatientMergeResponse confirmMerge(
        UUID requestedTenantId,
        UUID mergeId,
        String decisionReason,
        String actorUserId
    ) {
        UUID tenantId = requireTenant(requestedTenantId);
        requireActor(actorUserId);
        PatientMergeLog merge = findMerge(tenantId, mergeId);
        if (merge.getStatus() != MergeStatus.PENDING) {
            throw new ConflictException("Only a pending merge can be confirmed");
        }
        if (merge.getRequesterUserId().equals(actorUserId)) {
            throw new ForbiddenException("The merge requester cannot confirm the same request");
        }
        if (decisionReason != null && decisionReason.length() > 1000) {
            throw new ValidationException("Decision reason must be at most 1000 characters");
        }
        Patient source = requireActivePatient(tenantId, merge.getSourcePatientId());
        requireActivePatient(tenantId, merge.getTargetPatientId());
        Instant now = clock.instant();
        source.setMergedIntoPatientId(merge.getTargetPatientId());
        source.setMergedAt(now);
        merge.setStatus(MergeStatus.CONFIRMED);
        merge.setConfirmerUserId(actorUserId);
        merge.setDecisionReason(decisionReason == null ? null : decisionReason.strip());
        merge.setConfirmedAt(now);
        PatientMergeLog saved = mergeRepository.save(merge);
        patientRepository.save(source);
        eventPublisher.publishEvent(new PatientMergedEvent(
            tenantId, saved.getId(), saved.getSourcePatientId(), saved.getTargetPatientId(),
            actorUserId, "CONFIRMED", now
        ));
        return toResponse(saved);
    }

    @Transactional
    public PatientMergeResponse cancelMerge(
        UUID requestedTenantId,
        UUID mergeId,
        String reason,
        String actorUserId,
        String actorRole
    ) {
        UUID tenantId = requireTenant(requestedTenantId);
        requireActor(actorUserId);
        requireReason(reason);
        PatientMergeLog merge = findMerge(tenantId, mergeId);
        if (merge.getStatus() != MergeStatus.PENDING) {
            throw new ConflictException("Only a pending merge can be cancelled");
        }
        if (!merge.getRequesterUserId().equals(actorUserId) && !isPrivileged(actorRole)) {
            throw new ForbiddenException("Only the requester or a merge administrator can cancel this request");
        }
        merge.setStatus(MergeStatus.CANCELLED);
        merge.setDecisionReason(reason.strip());
        merge.setCancelledAt(clock.instant());
        return toResponse(mergeRepository.save(merge));
    }

    @Transactional
    public PatientMergeResponse reverseMerge(
        UUID requestedTenantId,
        UUID mergeId,
        String reason,
        String actorUserId
    ) {
        UUID tenantId = requireTenant(requestedTenantId);
        requireActor(actorUserId);
        requireReason(reason);
        PatientMergeLog merge = findMerge(tenantId, mergeId);
        if (merge.getStatus() != MergeStatus.CONFIRMED) {
            throw new ConflictException("Only a confirmed merge can be reversed");
        }
        Patient source = patientRepository.findByIdAndTenantId(merge.getSourcePatientId(), tenantId)
            .orElseThrow(() -> new NotFoundException("Source patient not found"));
        if (!merge.getTargetPatientId().equals(source.getMergedIntoPatientId())) {
            throw new ConflictException("The source patient no longer points to the merged target");
        }
        Instant now = clock.instant();
        source.setMergedIntoPatientId(null);
        source.setMergedAt(null);
        merge.setStatus(MergeStatus.REVERSED);
        merge.setDecisionReason(reason.strip());
        merge.setConfirmerUserId(actorUserId);
        merge.setReversedAt(now);
        PatientMergeLog saved = mergeRepository.save(merge);
        patientRepository.save(source);
        eventPublisher.publishEvent(new PatientMergedEvent(
            tenantId, saved.getId(), saved.getSourcePatientId(), saved.getTargetPatientId(),
            actorUserId, "REVERSED", now
        ));
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PatientMergeResponse getMerge(UUID requestedTenantId, UUID mergeId) {
        return toResponse(findMerge(requireTenant(requestedTenantId), mergeId));
    }

    @Transactional(readOnly = true)
    public PageResponse<PatientMergeResponse> listMerges(
        UUID requestedTenantId,
        int page,
        int size,
        String sort,
        String status,
        LocalDate from,
        LocalDate to
    ) {
        UUID tenantId = requireTenant(requestedTenantId);
        validatePage(page, size);
        if (from != null && to != null && from.isAfter(to)) {
            throw new ValidationException("The start date must not be after the end date");
        }
        MergeStatus mergeStatus = parseStatus(status);
        Sort ordering = parseSort(sort);
        Specification<PatientMergeLog> specification = (root, query, builder) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            predicates.add(builder.equal(root.get("tenantId"), tenantId));
            if (mergeStatus != null) {
                predicates.add(builder.equal(root.get("status"), mergeStatus));
            }
            if (from != null) {
                predicates.add(builder.greaterThanOrEqualTo(
                    root.get("requestedAt"), from.atStartOfDay(ZoneOffset.UTC).toInstant()
                ));
            }
            if (to != null) {
                predicates.add(builder.lessThan(
                    root.get("requestedAt"), to.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant()
                ));
            }
            return builder.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
        Page<PatientMergeLog> result = mergeRepository.findAll(
            specification, PageRequest.of(page, size, ordering)
        );
        return new PageResponse<>(
            result.getContent().stream().map(this::toResponse).toList(),
            result.getNumber(), result.getSize(), result.getTotalElements()
        );
    }

    @Transactional(readOnly = true)
    public List<PatientMergeResponse> getMergeHistoryForPatient(UUID requestedTenantId, UUID patientId) {
        UUID tenantId = requireTenant(requestedTenantId);
        requirePatient(tenantId, patientId);
        return mergeRepository
            .findAllByTenantIdAndSourcePatientIdOrTenantIdAndTargetPatientIdOrderByRequestedAtDesc(
                tenantId, patientId, tenantId, patientId
            )
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public MergeStatisticsResponse getStatistics(UUID requestedTenantId) {
        UUID tenantId = requireTenant(requestedTenantId);
        return new MergeStatisticsResponse(
            mergeRepository.countByTenantId(tenantId),
            mergeRepository.countByTenantIdAndStatus(tenantId, MergeStatus.PENDING),
            mergeRepository.countByTenantIdAndStatus(tenantId, MergeStatus.CONFIRMED),
            mergeRepository.countByTenantIdAndStatus(tenantId, MergeStatus.CANCELLED),
            mergeRepository.countByTenantIdAndStatus(tenantId, MergeStatus.REVERSED),
            mergeRepository.countByTenantId(tenantId)
        );
    }

    private double similarity(Patient left, Patient right) {
        double score = 0;
        if (equalsIgnoreCase(left.getFirstName(), right.getFirstName())) score += 0.25;
        if (equalsIgnoreCase(left.getLastName(), right.getLastName())) score += 0.25;
        if (left.getDateOfBirth() != null
            && right.getDateOfBirth() != null
            && left.getDateOfBirth().equals(right.getDateOfBirth())) score += 0.35;
        if (equalsIgnoreCase(left.getEmail(), right.getEmail())) score += 0.1;
        if (equalsIgnoreCase(left.getPhone(), right.getPhone())) score += 0.05;
        return score;
    }

    private String matchReason(Patient left, Patient right) {
        List<String> matches = new ArrayList<>();
        if (equalsIgnoreCase(left.getFirstName(), right.getFirstName())) matches.add("first name");
        if (equalsIgnoreCase(left.getLastName(), right.getLastName())) matches.add("last name");
        if (left.getDateOfBirth() != null
            && right.getDateOfBirth() != null
            && left.getDateOfBirth().equals(right.getDateOfBirth())) {
            matches.add("date of birth");
        }
        if (equalsIgnoreCase(left.getEmail(), right.getEmail())) matches.add("email");
        if (equalsIgnoreCase(left.getPhone(), right.getPhone())) matches.add("phone");
        return String.join(", ", matches);
    }

    private boolean equalsIgnoreCase(String left, String right) {
        return left != null && right != null && left.strip().equalsIgnoreCase(right.strip());
    }

    private String displayName(Patient patient) {
        return patient.getFirstName() + " " + patient.getLastName();
    }

    private UUID requireTenant(UUID requestedTenantId) {
        UUID tenantId = tenantRlsContext.apply();
        if (!Objects.equals(tenantId, requestedTenantId)) {
            throw new ForbiddenException("Tenant access denied");
        }
        return tenantId;
    }

    private Patient requirePatient(UUID tenantId, UUID patientId) {
        return patientRepository.findByIdAndTenantId(patientId, tenantId)
            .orElseThrow(() -> new NotFoundException("Patient not found"));
    }

    private Patient requireActivePatient(UUID tenantId, UUID patientId) {
        return patientRepository.findByIdAndTenantIdAndMergedIntoPatientIdIsNull(patientId, tenantId)
            .orElseThrow(() -> new NotFoundException("Patient not found"));
    }

    private PatientMergeLog findMerge(UUID tenantId, UUID mergeId) {
        return mergeRepository.findByIdAndTenantId(mergeId, tenantId)
            .orElseThrow(() -> new NotFoundException("Merge request not found"));
    }

    private void requireActor(String actorUserId) {
        if (actorUserId == null || actorUserId.isBlank() || actorUserId.length() > 128) {
            throw new ForbiddenException("Authenticated user is required");
        }
    }

    private void requireReason(String reason) {
        if (reason == null || reason.isBlank() || reason.length() > 1000) {
            throw new ValidationException("A reason of at most 1000 characters is required");
        }
    }

    private boolean isPrivileged(String role) {
        return role != null && PRIVILEGED_ROLES.contains(role.toUpperCase(Locale.ROOT));
    }

    private void validatePage(int page, int size) {
        if (page < 0 || size < 1 || size > MAX_PAGE_SIZE) {
            throw new ValidationException("Page must be non-negative and size must be between 1 and 100");
        }
    }

    private MergeStatus parseStatus(String status) {
        if (status == null || status.isBlank()) return null;
        try {
            return MergeStatus.valueOf(status.strip().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ValidationException("Merge status is invalid");
        }
    }

    private Sort parseSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "requestedAt");
        }
        String[] parts = sort.split(",", -1);
        String field = parts[0].strip();
        if (!SORT_FIELDS.contains(field) || parts.length > 2) {
            throw new ValidationException("Merge sort field is invalid");
        }
        Sort.Direction direction = Sort.Direction.DESC;
        if (parts.length == 2) {
            try {
                direction = Sort.Direction.fromString(parts[1].strip());
            } catch (IllegalArgumentException exception) {
                throw new ValidationException("Merge sort direction is invalid");
            }
        }
        return Sort.by(direction, field);
    }

    private PatientMergeResponse toResponse(PatientMergeLog merge) {
        return new PatientMergeResponse(
            merge.getId(),
            merge.getSourcePatientId(),
            merge.getTargetPatientId(),
            merge.getStatus().name(),
            merge.getRequesterUserId(),
            merge.getConfirmerUserId(),
            merge.getRequestReason(),
            merge.getDecisionReason(),
            merge.getRequestedAt(),
            merge.getConfirmedAt(),
            merge.getCancelledAt(),
            merge.getReversedAt(),
            merge.getVersion()
        );
    }
}