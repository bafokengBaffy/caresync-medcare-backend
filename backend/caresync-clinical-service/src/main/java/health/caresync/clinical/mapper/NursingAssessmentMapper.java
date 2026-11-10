package health.caresync.clinical.mapper;

import health.caresync.clinical.domain.entity.NursingAssessment;
import health.caresync.clinical.dto.NursingAssessmentCreateRequest;
import health.caresync.clinical.dto.NursingAssessmentResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface NursingAssessmentMapper {
    NursingAssessmentResponse toResponse(NursingAssessment entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    NursingAssessment toEntity(NursingAssessmentCreateRequest request);
}