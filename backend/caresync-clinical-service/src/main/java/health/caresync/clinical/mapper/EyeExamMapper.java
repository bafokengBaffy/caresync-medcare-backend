package health.caresync.clinical.mapper;

import health.caresync.clinical.domain.entity.EyeExam;
import health.caresync.clinical.dto.EyeExamCreateRequest;
import health.caresync.clinical.dto.EyeExamResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface EyeExamMapper {
    EyeExamResponse toResponse(EyeExam entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "archivedAt", ignore = true)
    EyeExam toEntity(EyeExamCreateRequest request);
}