package health.caresync.patient.mapper;
import health.caresync.patient.domain.entity.Provider;
import health.caresync.patient.dto.*;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
@Mapper(componentModel = "spring")
public interface ProviderMapper {
    ProviderResponse toResponse(Provider p);
    ProviderSummaryResponse toSummary(Provider p);
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "active", ignore = true)
    Provider toEntity(ProviderCreateRequest req);
}