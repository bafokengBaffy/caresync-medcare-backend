package health.caresync.common.util;
import java.util.UUID;
public final class UuidUtils {
    public static UUID parse(String s) { return UUID.fromString(s); }
    private UuidUtils() { }
}