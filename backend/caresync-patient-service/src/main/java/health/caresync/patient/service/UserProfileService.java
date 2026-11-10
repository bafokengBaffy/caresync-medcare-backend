package health.caresync.patient.service;

import health.caresync.common.exception.ForbiddenException;
import health.caresync.common.exception.NotFoundException;
import health.caresync.common.exception.ValidationException;
import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.tenant.TenantRlsContext;
import health.caresync.patient.dto.profile.UserProfileResponse;
import health.caresync.patient.dto.profile.UpdateProfileRequest;
import health.caresync.patient.storage.SupabaseProfileImageStorage;
import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class UserProfileService {
    private final JdbcTemplate jdbcTemplate;
    private final TenantRlsContext tenantRlsContext;
    private final AuditService auditService;
    private final SupabaseProfileImageStorage imageStorage;
    private final String storageUrl;
    private final String storageBucket;

    public UserProfileService(
        JdbcTemplate jdbcTemplate,
        TenantRlsContext tenantRlsContext,
        AuditService auditService,
        SupabaseProfileImageStorage imageStorage,
        @Value("${caresync.storage.url:}") String storageUrl,
        @Value("${caresync.storage.profile-image-bucket:caresync bucket}") String storageBucket
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.tenantRlsContext = tenantRlsContext;
        this.auditService = auditService;
        this.imageStorage = imageStorage;
        this.storageUrl = storageUrl == null ? "" : storageUrl.replaceAll("/+$", "");
        this.storageBucket = storageBucket;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse get(CaresyncPrincipal actor) {
        requireProvisioned(actor);
        tenantRlsContext.applyIdentity(actor);
        return find(actor.userId());
    }

    @Transactional
    public UserProfileResponse update(
        CaresyncPrincipal actor,
        UpdateProfileRequest request,
        HttpServletRequest servletRequest
    ) {
        requireProvisioned(actor);
        tenantRlsContext.applyIdentity(actor);
        int updated = jdbcTemplate.update("""
            INSERT INTO user_profiles (firebase_uid, full_name, phone, email, tenant_id)
            SELECT firebase_uid, ?, ?, email, tenant_id
            FROM firebase_users
            WHERE firebase_uid = ? AND deleted_at IS NULL
            ON CONFLICT (firebase_uid) DO UPDATE SET
                full_name = EXCLUDED.full_name,
                phone = EXCLUDED.phone,
                updated_at = NOW()
            """,
            request.fullName().trim(),
            normalizePhone(request.phone()),
            actor.userId()
        );
        if (updated != 1) throw new NotFoundException("User profile not found");
        auditService.recordAdministrativeAction(
            actor, actor.tenantId(), "PROFILE_UPDATED", "USER_PROFILE",
            actor.userId(), servletRequest
        );
        return find(actor.userId());
    }

    @Transactional
    public UserProfileResponse uploadImage(
        CaresyncPrincipal actor,
        MultipartFile image,
        HttpServletRequest servletRequest
    ) {
        requireProvisioned(actor);
        tenantRlsContext.applyIdentity(actor);
        SupabaseProfileImageStorage.StoredImage stored = imageStorage.upload(actor.userId(), image);
        validateOwnPublicUrl(actor.userId(), stored.publicUrl());
        try {
            validateOwnPublicUrl(actor.userId(), stored.publicUrl());
            int updated = jdbcTemplate.update("""
                INSERT INTO user_profiles (firebase_uid, full_name, phone, email, tenant_id, profile_image_url)
                SELECT firebase_uid, '', NULL, email, tenant_id, ?
                FROM firebase_users
                WHERE firebase_uid = ? AND deleted_at IS NULL
                ON CONFLICT (firebase_uid) DO UPDATE SET
                    profile_image_url = EXCLUDED.profile_image_url,
                    updated_at = NOW()
                """, stored.publicUrl(), actor.userId());
            if (updated != 1) throw new NotFoundException("User profile not found");
            auditService.recordAdministrativeAction(
                actor, actor.tenantId(), "PROFILE_IMAGE_UPDATED", "USER_PROFILE",
                actor.userId(), servletRequest
            );
        } catch (RuntimeException exception) {
            try {
                imageStorage.delete(stored.objectPath());
            } catch (RuntimeException cleanupFailure) {
                exception.addSuppressed(cleanupFailure);
            }
            throw exception;
        }
        return find(actor.userId());
    }

    private UserProfileResponse find(String firebaseUid) {
        UserProfileResponse profile = jdbcTemplate.query("""
            SELECT u.firebase_uid, COALESCE(p.full_name, '') AS full_name, p.phone, u.email,
                   p.profile_image_url, u.role, u.tenant_id, t.name AS tenant_name,
                   u.created_at, p.updated_at
            FROM firebase_users u
            LEFT JOIN user_profiles p ON p.firebase_uid = u.firebase_uid
            LEFT JOIN tenants t ON t.id = u.tenant_id
            WHERE u.firebase_uid = ? AND u.deleted_at IS NULL
            """,
            statement -> statement.setString(1, firebaseUid),
            resultSet -> resultSet.next() ? mapProfile(resultSet) : null
        );
        if (profile == null) throw new NotFoundException("User profile not found");
        return profile;
    }

    private void validateOwnPublicUrl(String firebaseUid, String publicUrl) {
        if (storageUrl.isBlank() || storageBucket == null || storageBucket.isBlank()) {
            throw new IllegalStateException("Profile image storage is not configured");
        }
        try {
            URI configured = URI.create(storageUrl);
            URI candidate = URI.create(publicUrl);
            String expectedPath = configured.getRawPath()
                + "/storage/v1/object/public/" + encodePath(storageBucket) + "/"
                + encodePath(firebaseUid) + "/";
            String rawPath = candidate.getRawPath();
            if (!"https".equalsIgnoreCase(candidate.getScheme())
                || configured.getHost() == null
                || candidate.getHost() == null
                || !configured.getHost().equalsIgnoreCase(candidate.getHost())
                || configured.getPort() != candidate.getPort()
                || candidate.getRawQuery() != null
                || candidate.getRawFragment() != null
                || rawPath == null
                || !rawPath.startsWith(expectedPath)
                || !rawPath.matches(java.util.regex.Pattern.quote(expectedPath)
                    + "[A-Za-z0-9-]{36}\\.(?:jpg|jpeg|png|webp)")) {
                throw new ValidationException("Profile image URL is not a valid image in your own storage folder");
            }
        } catch (IllegalArgumentException exception) {
            throw new ValidationException("Profile image URL is invalid");
        }
    }

    private static String encodePath(String value) {
        return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8)
            .replace("+", "%20")
            .replace("%2F", "/");
    }

    private static UserProfileResponse mapProfile(ResultSet resultSet) throws SQLException {
        Timestamp createdAt = resultSet.getTimestamp("created_at");
        Timestamp updatedAt = resultSet.getTimestamp("updated_at");
        return new UserProfileResponse(
            resultSet.getString("firebase_uid"),
            resultSet.getString("full_name"),
            resultSet.getString("phone"),
            resultSet.getString("email"),
            resultSet.getString("profile_image_url"),
            resultSet.getString("role"),
            resultSet.getObject("tenant_id", UUID.class),
            resultSet.getString("tenant_name"),
            createdAt == null ? null : createdAt.toInstant(),
            updatedAt == null ? null : updatedAt.toInstant()
        );
    }

    private static String normalizePhone(String phone) {
        if (phone == null || phone.isBlank()) return null;
        String normalized = phone.trim();
        if (!normalized.matches("[+0-9(). -]{1,32}")) {
            throw new ValidationException("Phone number contains unsupported characters");
        }
        return normalized;
    }

    private static void requireProvisioned(CaresyncPrincipal actor) {
        if (actor == null || actor.userId() == null || actor.role() == null) {
            throw new ForbiddenException("An approved CareSync account is required");
        }
    }
}
