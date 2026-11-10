package health.caresync.laboratory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
@SpringBootApplication(scanBasePackages = {"health.caresync.laboratory", "health.caresync.common"})
@EnableJpaAuditing
public class LaboratoryServiceApplication {
    public static void main(String[] args) { SpringApplication.run(LaboratoryServiceApplication.class, args); }
}
