package health.caresync.patient.dto;

import health.caresync.common.validation.ValidPhoneNumber;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/**
 * DTO for updating an existing Patient.
 * OWASP Alignment: Strict validation on mutable fields. Does not allow changing
 * immutable fields like dateOfBirth or tenantId.
 */
public class PatientUpdateRequest {

    @Size(max = 100)
    private String firstName;

    @Size(max = 100)
    private String lastName;

    @Size(max = 20)
    private String gender;

    @Email(message = "Invalid email format")
    @Size(max = 255)
    private String email;

    @ValidPhoneNumber
    @Size(max = 20)
    private String phone;

    @Size(max = 255)
    private String address;

    @Size(max = 200)
    private String emergencyContactName;

    @ValidPhoneNumber
    @Size(max = 20)
    private String emergencyContactPhone;

    // Getters and Setters
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getEmergencyContactName() { return emergencyContactName; }
    public void setEmergencyContactName(String emergencyContactName) { this.emergencyContactName = emergencyContactName; }
    public String getEmergencyContactPhone() { return emergencyContactPhone; }
    public void setEmergencyContactPhone(String emergencyContactPhone) { this.emergencyContactPhone = emergencyContactPhone; }
}
