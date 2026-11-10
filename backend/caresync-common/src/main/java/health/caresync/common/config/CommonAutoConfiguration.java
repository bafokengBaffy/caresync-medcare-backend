package health.caresync.common.config;

import health.caresync.common.exception.GlobalExceptionHandler;
import health.caresync.common.exception.GlobalExceptionHandler;
import health.caresync.common.security.FirebaseAdminTokenVerifier;
import health.caresync.common.security.FirebaseJwtFilter;
import health.caresync.common.security.FirebaseTokenVerifier;
import health.caresync.common.security.SecurityConfig;
import health.caresync.common.security.TenantContextFilter;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;

@AutoConfiguration
@Import({
    FirebaseAdminConfig.class,
    FirebaseAdminTokenVerifier.class,
    GlobalExceptionHandler.class,
    SecurityConfig.class
})
public class CommonAutoConfiguration {
    @Bean
    @ConditionalOnMissingBean
    public FirebaseJwtFilter firebaseJwtFilter(FirebaseTokenVerifier tokenVerifier) {
        return new FirebaseJwtFilter(tokenVerifier);
    }

    @Bean
    @ConditionalOnMissingBean
    public TenantContextFilter tenantContextFilter() {
        return new TenantContextFilter();
    }
}
