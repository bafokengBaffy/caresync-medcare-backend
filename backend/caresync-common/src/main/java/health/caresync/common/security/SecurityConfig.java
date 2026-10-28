package health.caresync.common.security;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(
        HttpSecurity http,
        FirebaseJwtFilter firebaseJwtFilter,
        TenantContextFilter tenantContextFilter
    ) throws Exception {
        http.csrf(c -> c.disable())
            .cors(c -> c.configurationSource(corsConfigurationSource()))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .httpBasic(c -> c.disable())
            .formLogin(c -> c.disable())
            .authorizeHttpRequests(a -> a
                .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                .anyRequest().authenticated())
            .exceptionHandling(e -> e
                .authenticationEntryPoint((request, response, exception) ->
                    response.sendError(401, "Authentication required"))
                .accessDeniedHandler((request, response, exception) ->
                    response.sendError(403, "Access denied")))
            .addFilterBefore(firebaseJwtFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(tenantContextFilter, FirebaseJwtFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
            "http://localhost:5173",
            "https://caresync-medcare-9e0a5.web.app",
            "https://caresync-medcare-9e0a5.firebaseapp.com"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Tenant-ID", "X-Requested-With"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public FirebaseJwtFilter firebaseJwtFilter(FirebaseTokenVerifier tokenVerifier) {
        return new FirebaseJwtFilter(tokenVerifier);
    }

    @Bean
    public TenantContextFilter tenantContextFilter() {
        return new TenantContextFilter();
    }
}