package health.caresync.common.audit;
public interface AuditClient { void write(AuditEvent event); }