package health.caresync.billing.service;

import health.caresync.billing.domain.entity.ProBonoRecord;
import health.caresync.billing.domain.repository.ProBonoRecordRepository;
import health.caresync.billing.dto.ProBonoRequest;
import health.caresync.billing.dto.ProBonoResponse;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.security.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProBonoService {

    private static final Logger log = LoggerFactory.getLogger(ProBonoService.class);

    private final ProBonoRecordRepository repository;

    public ProBonoService(ProBonoRecordRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ProBonoResponse> listForTenant() {
        return repository.findAllByTenantIdOrderByApprovedAtDesc(requireTenant())
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public ProBonoResponse create(ProBonoRequest req, String actorId) {
        String tenantId = requireTenant();
        if (req.reason() == null || req.reason().isBlank()) {
            throw new ValidationException("reason is required");
        }
        ProBonoRecord record = new ProBonoRecord(
                tenantId, req.patientId(), req.serviceCode(), req.reason(), actorId);
        ProBonoRecord saved = repository.save(record);
        log.info("ProBonoRecord created id={} tenant={} patient={}",
                saved.getId(), tenantId, saved.getPatientId());
        return toResponse(saved);
    }

    private String requireTenant() {
        String t = TenantContext.getTenantId();
        if (t == null || t.isBlank()) throw new ValidationException("Tenant context missing");
        return t;
    }

    private ProBonoResponse toResponse(ProBonoRecord r) {
        return new ProBonoResponse(
                r.getId(), r.getTenantId(), r.getPatientId(),
                r.getServiceCode(), r.getReason(), r.getApprovedBy(), r.getApprovedAt());
    }
}