package health.caresync.common.cache;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

/** Redis config — username/password from env (OWASP A02). */
@Configuration
@Profile({"prod","gcp","redis"})
public class RedisConfig {

    @Value("${caresync.redis.host:localhost}") private String host;
    @Value("${caresync.redis.port:6379}") private int port;
    @Value("${caresync.redis.username:}") private String username;
    @Value("${caresync.redis.password:}") private String password;

    @Bean(destroyMethod = "destroy")
    public LettuceConnectionFactory redisConnectionFactory() {
        RedisStandaloneConfiguration cfg = new RedisStandaloneConfiguration(host, port);
        if (username != null && !username.isBlank()) cfg.setUsername(username);
        if (password != null && !password.isBlank()) cfg.setPassword(password);
        return new LettuceConnectionFactory(cfg);
    }

    @Bean
    public StringRedisTemplate stringRedisTemplate(LettuceConnectionFactory factory) {
        return new StringRedisTemplate(factory);
    }
}