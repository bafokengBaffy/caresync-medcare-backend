package health.caresync.common.security;

import org.springframework.stereotype.Component;

import java.util.Collection;

/** Simple permission check — modules may override. */
@Component
public class PermissionEvaluator {

    public boolean hasPermission(Collection<String> userPermissions, String required) {
        return userPermissions != null && userPermissions.contains(required);
    }
}