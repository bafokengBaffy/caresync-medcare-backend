package health.caresync.gateway;

import java.util.Arrays;
import java.time.Duration;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import org.springframework.cloud.gateway.route.RouteLocator;

@SpringBootApplication
public class ApiGatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }

    @Bean
    ApplicationRunner startupDiagnostics(Environment env, ApplicationContext context, RouteLocator routes) {
        return args -> {
            System.out.println("=================================================");
            System.out.println("[API GATEWAY] Starting service...");
            System.out.println("[API GATEWAY] Active profiles: " + Arrays.toString(env.getActiveProfiles()));
            System.out.println("[API GATEWAY] Server port: " + env.getProperty("server.port", "8080"));
            System.out.println("[API GATEWAY] Database: No direct datasource configured");
            System.out.println("[API GATEWAY] Application context: " + context.getApplicationName());
            System.out.println("[API GATEWAY] Registered routes:");
            var registeredRoutes = routes.getRoutes().collectList().block(Duration.ofSeconds(5));
            if (registeredRoutes == null) {
                throw new IllegalStateException("Gateway route discovery returned no result");
            }
            registeredRoutes.forEach(route ->
                System.out.println("  " + route.getId() + " " + route.getPredicate()));
            System.out.println("[API GATEWAY] Startup diagnostics complete.");
            System.out.println("=================================================");
        };
    }
}