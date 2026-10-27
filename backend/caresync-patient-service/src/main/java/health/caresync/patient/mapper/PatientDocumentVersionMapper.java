package health.caresync.patient.mapper;

import health.caresync.patient.domain.entity.PatientDocumentVersion;
import health.caresync.patient.dto.PatientDocumentVersionResponse;
import org.springframework.stereotype.Component;

@Component
public class PatientDocumentVersionMapper {
    public PatientDocumentVersionResponse toResponse(PatientDocumentVersion version) {
        return new PatientDocumentVersionResponse(
            version.getId(),
            version.getDocumentId(),
            version.getVersionNumber(),
            version.getFileName(),
            version.getContentType(),
            version.getSizeBytes(),
            version.getCreatedBy(),
            version.getCreatedAt()
        );
    }
}