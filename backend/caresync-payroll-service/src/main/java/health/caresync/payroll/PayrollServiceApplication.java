package health.caresync.payroll;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = {"health.caresync.payroll", "health.caresync.common"})
@EntityScan("health.caresync.payroll.domain")
@EnableJpaRepositories("health.caresync.payroll.repository")
@EnableJpaAuditing
@EnableScheduling
@EnableDiscoveryClient
public class PayrollServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(PayrollServiceApplication.class, args);
    }
}
