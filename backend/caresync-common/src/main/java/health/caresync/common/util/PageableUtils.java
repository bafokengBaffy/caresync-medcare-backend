package health.caresync.common.util;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import java.util.Set;
public final class PageableUtils {
    public static Pageable sanitize(Pageable p, Set<String> allowed) {
        var sort = Sort.by(p.getSort().stream().filter(o -> allowed.contains(o.getProperty())).toList());
        return org.springframework.data.domain.PageRequest.of(p.getPageNumber(), p.getPageSize(), sort);
    }
    private PageableUtils() { }
}