package health.caresync.clinical;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
@SpringBootApplication(scanBasePackages = {"health.caresync.clinical", "health.caresync.common"})
@EnableJpaAuditing
public class ClinicalServiceApplication {
    public static void main(String[] args) { SpringApplication.run(ClinicalServiceApplication.class, args); }
}
