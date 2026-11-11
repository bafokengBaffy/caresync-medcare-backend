package health.caresync.common.web;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Placeholder for URL/hdr API versioning; extend when a v2 ships. */
@Configuration
public class ApiVersioningConfig implements WebMvcConfigurer {
    public String resolveVersion(HttpServletRequest req) { return "v1"; }
}