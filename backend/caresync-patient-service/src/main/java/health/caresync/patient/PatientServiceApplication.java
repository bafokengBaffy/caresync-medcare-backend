package health.caresync.patient;

import java.util.Arrays;
import java.sql.SQLException;
import javax.sql.DataSource;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.core.env.Environment;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

@SpringBootApplication
@ComponentScan({"health.caresync.patient", "health.caresync.common"})
@EnableJpaAuditing
public class PatientServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(PatientServiceApplication.class, args);
    }

    @Bean
    ApplicationRunner startupDiagnostics(Environment env, ApplicationContext context, RequestMappingHandlerMapping mapping, DataSource dataSource) {
        return args -> {
            System.out.println("=================================================");
            System.out.println("[PATIENT SERVICE] Starting service...");
            System.out.println("[PATIENT SERVICE] Active profiles: " + Arrays.toString(env.getActiveProfiles()));
            System.out.println("[PATIENT SERVICE] Server port: " + env.getProperty("server.port", "8080"));
            System.out.println("[PATIENT SERVICE] Application context: " + context.getApplicationName());
            try (var connection = dataSource.getConnection()) {
                var database = connection.getMetaData();
                System.out.println("[PATIENT SERVICE] Database connected: " + database.getDatabaseProductName() + " " + database.getDatabaseProductVersion());
            } catch (SQLException e) {
                System.out.println("[PATIENT SERVICE] Database connection check failed (" + e.getClass().getSimpleName() + ")");
                throw new IllegalStateException("Patient service database connection check failed", e);
            }
            System.out.println("[PATIENT SERVICE] Registered endpoints:");
            mapping.getHandlerMethods().forEach((details, method) -> System.out.println("  " + details + " -> " + method));
            System.out.println("[PATIENT SERVICE] Startup diagnostics complete.");
            System.out.println("=================================================");
        };
    }
}