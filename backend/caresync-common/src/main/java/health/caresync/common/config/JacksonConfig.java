package health.caresync.common.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Safe Jackson defaults (no polymorphic typing, unknown fields rejected — OWASP A08). */
@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper m = new ObjectMapper();
        m.registerModule(new JavaTimeModule());
        m.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        m.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        m.enable(DeserializationFeature.FAIL_ON_READING_DUP_TREE_KEY);
        // No activateDefaultTyping — prevents gadget-chain attacks.
        return m;
    }
}