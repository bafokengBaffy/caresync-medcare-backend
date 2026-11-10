package health.caresync.patient.dto;

import java.util.UUID;

/**
 * DTO for returning Provider data.
 * OWASP Alignment: Excludes sensitive internal identifiers (like license numbers)
 * from general API responses.
 */
public class ProviderResponse {

    private UUID id;
    private String firstName;
    private String lastName;
    private String specialty;
    private boolean isActive;

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getSpecialty() { return specialty; }
    public void setSpecialty(String specialty) { this.specialty = specialty; }
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
}
