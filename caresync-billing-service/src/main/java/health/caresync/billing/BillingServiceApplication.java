package health.caresync.billing;

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
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

@SpringBootApplication
@ComponentScan({"health.caresync.billing", "health.caresync.common"})
public class BillingServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(BillingServiceApplication.class, args);
    }

    @Bean
    ApplicationRunner startupDiagnostics(Environment env, ApplicationContext context, RequestMappingHandlerMapping mapping, DataSource dataSource) {
        return args -> {
            System.out.println("=================================================");
            System.out.println("[BILLING SERVICE] Starting service...");
            System.out.println("[BILLING SERVICE] Active profiles: " + Arrays.toString(env.getActiveProfiles()));
            System.out.println("[BILLING SERVICE] Server port: " + env.getProperty("server.port", "8080"));
            System.out.println("[BILLING SERVICE] Application context: " + context.getApplicationName());
            try (var connection = dataSource.getConnection()) {
                var database = connection.getMetaData();
                System.out.println("[BILLING SERVICE] Database connected: " + database.getDatabaseProductName() + " " + database.getDatabaseProductVersion());
            } catch (SQLException e) {
                System.out.println("[BILLING SERVICE] Database connection check failed (" + e.getClass().getSimpleName() + ")");
                throw new IllegalStateException("Billing service database connection check failed", e);
            }
            System.out.println("[BILLING SERVICE] Registered endpoints:");
            mapping.getHandlerMethods().forEach((details, method) -> System.out.println("  " + details + " -> " + method));
            System.out.println("[BILLING SERVICE] Startup diagnostics complete.");
            System.out.println("=================================================");
        };
    }
}
