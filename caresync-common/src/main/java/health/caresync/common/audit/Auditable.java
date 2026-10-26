package health.caresync.common.audit;
import java.lang.annotation.*;
@Target(ElementType.METHOD) @Retention(RetentionPolicy.RUNTIME)
public @interface Auditable { String resource(); String action(); }