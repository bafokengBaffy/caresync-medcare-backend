package health.caresync.clinical.service;

import health.caresync.clinical.domain.PatientDiagnosisCodeRepository;
import health.caresync.clinical.domain.entity.PatientDiagnosisCode;
import health.caresync.clinical.dto.PatientDiagnosisCodeRequest;
import health.caresync.clinical.dto.PatientDiagnosisCodeResponse;
import health.caresync.common.exception.NotFoundException;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.tenant.TenantRlsContext;
import java.time.LocalDate;
import java.util.Locale;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PatientDiagnosisCodeService {
    private final PatientDiagnosisCodeRepository diagnosisCodes;
    private final JdbcTemplate jdbcTemplate;
    private final TenantRlsContext tenantRlsContext;

    public PatientDiagnosisCodeService(
        PatientDiagnosisCodeRepository diagnosisCodes,
        JdbcTemplate jdbcTemplate,
        TenantRlsContext tenantRlsContext
    ) {
        this.diagnosisCodes = diagnosisCodes;
        this.jdbcTemplate = jdbcTemplate;
        this.tenantRlsContext = tenantRlsContext;
    }

    @Transactional
    public PatientDiagnosisCodeResponse create(PatientDiagnosisCodeRequest request) {
        UUID tenantId = tenantRlsContext.apply();
        Boolean patientExists = jdbcTemplate.queryForObject(
            "select exists(select 1 from public.patients where tenant_id = ? and id = ?)",
            Boolean.class,
            tenantId,
            request.patientId()
        );
        if (!Boolean.TRUE.equals(patientExists)) {
            throw new NotFoundException("Patient not found");
        }
        if (request.codedOn().isAfter(LocalDate.now())) {
            throw new ValidationException("Diagnosis code date cannot be in the future");
        }

        PatientDiagnosisCode diagnosisCode = new PatientDiagnosisCode();
        diagnosisCode.setTenantId(tenantId);
        diagnosisCode.setPatientId(request.patientId());
        diagnosisCode.setCodingSystem(request.codingSystem().trim().toUpperCase(Locale.ROOT));
        diagnosisCode.setDiagnosisCode(request.diagnosisCode().trim().toUpperCase(Locale.ROOT));
        diagnosisCode.setCodedOn(request.codedOn());
        diagnosisCode = diagnosisCodes.saveAndFlush(diagnosisCode);
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication == null ? null : authentication.getPrincipal();
        String actorUserId = principal instanceof CaresyncPrincipal caresyncPrincipal
            ? caresyncPrincipal.userId()
            : authentication == null ? null : authentication.getName();
        String actorRole = principal instanceof CaresyncPrincipal caresyncPrincipal
            ? caresyncPrincipal.role()
            : null;
        jdbcTemplate.update(
            """
            INSERT INTO public.audit_logs
                (tenant_id, actor_user_id, actor_role, action, resource_type, resource_id)
            VALUES (?, ?, ?, 'DIAGNOSIS_CODE_RECORDED', 'patient_diagnosis_code', ?)
            """,
            tenantId,
            actorUserId,
            actorRole,
            diagnosisCode.getId().toString()
        );
        return new PatientDiagnosisCodeResponse(
            diagnosisCode.getId(),
            diagnosisCode.getPatientId(),
            diagnosisCode.getCodingSystem(),
            diagnosisCode.getDiagnosisCode(),
            diagnosisCode.getCodedOn(),
            diagnosisCode.getCreatedAt()
        );
    }
}
