package health.caresync.billing;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
@SpringBootApplication(scanBasePackages = {"health.caresync.billing", "health.caresync.common"})
@EnableJpaAuditing
public class BillingServiceApplication {
    public static void main(String[] args) { SpringApplication.run(BillingServiceApplication.class, args); }
}
