package health.caresync.patient;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Main entry point for the CareSync Patient Service.
 * OWASP Alignment: Enables JPA Auditing to automatically track creation/update timestamps
 * for forensic and compliance purposes.
 */
@SpringBootApplication(scanBasePackages = {"health.caresync.patient", "health.caresync.common"})
@EnableJpaAuditing
public class PatientServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(PatientServiceApplication.class, args);
    }
}
