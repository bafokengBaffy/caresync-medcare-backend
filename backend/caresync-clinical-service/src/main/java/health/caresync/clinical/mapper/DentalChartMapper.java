package health.caresync.clinical.mapper;

import health.caresync.clinical.domain.entity.DentalChart;
import health.caresync.clinical.dto.DentalChartCreateRequest;
import health.caresync.clinical.dto.DentalChartResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DentalChartMapper {
    DentalChartResponse toResponse(DentalChart entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "archivedAt", ignore = true)
    DentalChart toEntity(DentalChartCreateRequest request);
}