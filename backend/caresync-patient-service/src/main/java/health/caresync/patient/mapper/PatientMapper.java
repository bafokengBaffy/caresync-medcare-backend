package health.caresync.patient.mapper;

import health.caresync.patient.domain.entity.Patient;
import health.caresync.patient.dto.PatientCreateRequest;
import health.caresync.patient.dto.PatientResponse;
import health.caresync.patient.dto.PatientSummaryResponse;
import org.springframework.stereotype.Component;

/**
 * Mapper for converting Patient entities to DTOs and vice versa.
 * OWASP Alignment: Ensures that internal entity structures are never exposed
 * directly to the client, preventing Mass Assignment and Data Leakage.
 */
@Component
public class PatientMapper {

    public Patient toEntity(PatientCreateRequest request) {
        if (request == null) return null;
        Patient patient = new Patient();
        patient.setFirstName(request.getFirstName());
        patient.setLastName(request.getLastName());
        patient.setDateOfBirth(request.getDateOfBirth());
        patient.setGender(request.getGender());
        patient.setEmail(request.getEmail());
        patient.setPhone(request.getPhone());
        patient.setAddress(request.getAddress());
        patient.setEmergencyContactName(request.getEmergencyContactName());
        patient.setEmergencyContactPhone(request.getEmergencyContactPhone());
        return patient;
    }

    public PatientResponse toResponse(Patient patient) {
        if (patient == null) return null;
        PatientResponse response = new PatientResponse();
        response.setId(patient.getId());
        response.setFirstName(patient.getFirstName());
        response.setLastName(patient.getLastName());
        response.setDateOfBirth(patient.getDateOfBirth());
        response.setGender(patient.getGender());
        response.setEmail(patient.getEmail());
        response.setPhone(patient.getPhone());
        response.setAddress(patient.getAddress());
        response.setEmergencyContactName(patient.getEmergencyContactName());
        response.setEmergencyContactPhone(patient.getEmergencyContactPhone());
        response.setCreatedAt(patient.getCreatedAt());
        return response;
    }

    public PatientSummaryResponse toSummary(Patient patient) {
        if (patient == null) return null;
        return new PatientSummaryResponse(
            patient.getId(),
            patient.getFirstName(),
            patient.getLastName(),
            patient.getDateOfBirth(),
            patient.getEmail(),
            patient.getPhone()
        );
    }
}
