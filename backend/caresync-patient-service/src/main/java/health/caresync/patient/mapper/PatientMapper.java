package health.caresync.patient.mapper;
import health.caresync.patient.domain.entity.Patient;
import health.caresync.patient.dto.*;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
@Mapper(componentModel = "spring")
public interface PatientMapper {
    PatientResponse toResponse(Patient p);
    PatientSummaryResponse toSummary(Patient p);
    @Mapping(target = "tenantId", ignore = true)
    Patient toEntity(PatientCreateRequest req);
}