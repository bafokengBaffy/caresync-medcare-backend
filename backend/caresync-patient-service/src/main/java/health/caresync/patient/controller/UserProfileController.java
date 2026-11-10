package health.caresync.patient.controller;

import health.caresync.common.security.CaresyncPrincipal;
import health.caresync.common.web.ApiResponse;
import health.caresync.patient.dto.profile.UpdateProfileRequest;
import health.caresync.patient.dto.profile.UserProfileResponse;
import health.caresync.patient.service.UserProfileService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/profile")
@PreAuthorize("isAuthenticated()")
public class UserProfileController {
    private final UserProfileService profileService;

    public UserProfileController(UserProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<UserProfileResponse>> get(
        @AuthenticationPrincipal CaresyncPrincipal actor
    ) {
        return ResponseEntity.ok(ApiResponse.ok(profileService.get(actor)));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<UserProfileResponse>> update(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @Valid @RequestBody UpdateProfileRequest request,
        HttpServletRequest servletRequest
    ) {
        return ResponseEntity.ok(ApiResponse.ok(profileService.update(actor, request, servletRequest)));
    }

    @PatchMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<UserProfileResponse>> uploadImage(
        @AuthenticationPrincipal CaresyncPrincipal actor,
        @RequestPart("file") MultipartFile file,
        HttpServletRequest servletRequest
    ) {
        return ResponseEntity.ok(ApiResponse.ok(profileService.uploadImage(actor, file, servletRequest)));
    }
}
