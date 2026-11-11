package health.caresync.common.tenant;

import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;

/**
 * Stub tenant-aware routing datasource.
 * Real implementations wire a per-tenant DataSource map; this class exposes
 * the extension point without forcing a specific strategy.
 */
public class TenantRoutingDataSource extends AbstractRoutingDataSource {
    @Override
    protected Object determineCurrentLookupKey() {
        return null;    // override in a real multi-tenant deployment
    }
}