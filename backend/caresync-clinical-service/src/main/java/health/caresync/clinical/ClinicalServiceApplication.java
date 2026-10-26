package health.caresync.clinical;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan({"health.caresync.clinical", "health.caresync.common"})
public class ClinicalServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ClinicalServiceApplication.class, args);
    }
}
