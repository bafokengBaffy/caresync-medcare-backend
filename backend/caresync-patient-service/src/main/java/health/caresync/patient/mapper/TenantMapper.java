package health.caresync.patient.mapper;
import health.caresync.patient.domain.entity.Tenant;
import health.caresync.patient.dto.*;
import org.mapstruct.Mapper;
@Mapper(componentModel = "spring")
public interface TenantMapper { TenantResponse toResponse(Tenant t); }