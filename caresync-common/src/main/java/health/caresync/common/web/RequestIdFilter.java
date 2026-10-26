package health.caresync.common.web;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.util.UUID;

@Component
@Order(0)
public class RequestIdFilter implements Filter {
    @Override public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) throws IOException, ServletException {
        String rid = UUID.randomUUID().toString();
        MDC.put("requestId", rid);
        ((HttpServletResponse) res).setHeader(CorrelationHeaders.REQUEST_ID, rid);
        try { chain.doFilter(req, res); } finally { MDC.remove("requestId"); }
    }
}