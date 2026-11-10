package health.caresync.clinical.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
public class AppointmentRequest {
    @NotBlank private String patientId;
    @NotBlank private String providerId;
    @NotNull private Instant appointmentTime;
    private String reason;
    // Getters and Setters
    public String getPatientId() { return patientId; } public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getProviderId() { return providerId; } public void setProviderId(String providerId) { this.providerId = providerId; }
    public Instant getAppointmentTime() { return appointmentTime; } public void setAppointmentTime(Instant appointmentTime) { this.appointmentTime = appointmentTime; }
    public String getReason() { return reason; } public void setReason(String reason) { this.reason = reason; }
}
