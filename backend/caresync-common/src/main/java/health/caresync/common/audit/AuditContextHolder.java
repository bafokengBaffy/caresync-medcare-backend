package health.caresync.common.audit;
public final class AuditContextHolder {
    private static final ThreadLocal<AuditEvent> CURRENT = new ThreadLocal<>();
    public static void set(AuditEvent e) { CURRENT.set(e); }
    public static AuditEvent get() { return CURRENT.get(); }
    public static void clear() { CURRENT.remove(); }
    private AuditContextHolder() { }
}