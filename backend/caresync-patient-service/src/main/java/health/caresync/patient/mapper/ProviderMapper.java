package health.caresync.patient.mapper;

import health.caresync.patient.domain.entity.Provider;
import health.caresync.patient.dto.ProviderResponse;
import org.springframework.stereotype.Component;

/**
 * Mapper for converting Provider entities to DTOs.
 */
@Component
public class ProviderMapper {

    public ProviderResponse toResponse(Provider provider) {
        if (provider == null) return null;
        ProviderResponse response = new ProviderResponse();
        response.setId(provider.getId());
        response.setFirstName(provider.getFirstName());
        response.setLastName(provider.getLastName());
        response.setSpecialty(provider.getSpecialty());
        response.setActive(provider.isActive());
        return response;
    }
}
