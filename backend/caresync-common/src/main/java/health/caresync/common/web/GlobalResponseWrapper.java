package health.caresync.common.web;

import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

/** Optional wrapper — disabled by default to avoid surprises in downstream modules. */
// @ControllerAdvice  (commented out so it does not interfere with existing controllers)
public class GlobalResponseWrapper implements ResponseBodyAdvice<Object> {
    @Override public boolean supports(MethodParameter rt, Class conv) { return false; }
    @Override public Object beforeBodyWrite(Object body, MethodParameter rt, MediaType mt,
                                            Class conv, ServerHttpRequest req, ServerHttpResponse res) {
        return body;
    }
}