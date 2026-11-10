package health.caresync.clinical.mapper;

import health.caresync.clinical.domain.entity.MentalHealthAssessment;
import health.caresync.clinical.dto.MentalHealthAssessmentRequest;
import health.caresync.clinical.dto.MentalHealthAssessmentResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface MentalHealthAssessmentMapper {
    MentalHealthAssessmentResponse toResponse(MentalHealthAssessment entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    MentalHealthAssessment toEntity(MentalHealthAssessmentRequest request);
}