package health.caresync.common.util;
public final class RegexUtils {
    public static boolean isEmail(String s) { return s != null && s.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$"); }
    private RegexUtils() { }
}