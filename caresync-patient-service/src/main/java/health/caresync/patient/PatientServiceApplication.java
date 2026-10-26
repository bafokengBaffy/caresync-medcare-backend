package health.caresync.patient;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@ComponentScan({"health.caresync.patient", "health.caresync.common"})
@EnableJpaAuditing
public class PatientServiceApplication {
    public static void main(String[] args) { SpringApplication.run(PatientServiceApplication.class, args); }
}