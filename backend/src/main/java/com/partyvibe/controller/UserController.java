package com.partyvibe.controller;

import com.partyvibe.config.UserPrincipal;
import com.partyvibe.dto.GiftWallItemDto;
import com.partyvibe.dto.UpdateProfileRequest;
import com.partyvibe.dto.UserProfileDto;
import com.partyvibe.dto.UserSummaryDto;
import com.partyvibe.service.AuthService;
import com.partyvibe.service.GiftService;
import com.partyvibe.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User profile and search management")
public class UserController {

    private final UserService userService;
    private final AuthService authService;
    private final GiftService giftService;

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile")
    public ResponseEntity<UserProfileDto> getMe(@AuthenticationPrincipal UserPrincipal principal) {
        UserProfileDto profile = authService.getCurrentUserProfile(principal.getId());
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/me")
    @Operation(summary = "Update current user profile")
    public ResponseEntity<UserProfileDto> updateMe(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest req) {
        UserProfileDto updated = userService.updateProfile(principal.getId(), req);
        return ResponseEntity.ok(updated);
    }

    @PostMapping(value = "/avatar/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload avatar image file from device")
    public ResponseEntity<UserProfileDto> uploadAvatar(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        UserProfileDto updated = userService.uploadAvatar(principal.getId(), file);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user profile by ID")
    public ResponseEntity<UserProfileDto> getUserById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long currentUserId = principal != null ? principal.getId() : null;
        UserProfileDto profile = userService.getUserById(id, currentUserId);
        return ResponseEntity.ok(profile);
    }

    @GetMapping("/search")
    @Operation(summary = "Search users by username")
    public ResponseEntity<List<UserSummaryDto>> searchUsers(
            @RequestParam String q,
            @RequestParam(defaultValue = "20") int limit,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long currentUserId = principal != null ? principal.getId() : null;
        List<UserSummaryDto> results = userService.searchUsers(q, currentUserId, limit);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/recommended")
    @Operation(summary = "Get recommended users to follow")
    public ResponseEntity<List<UserSummaryDto>> getRecommended(
            @RequestParam(defaultValue = "10") int limit,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<UserSummaryDto> recommended = userService.getRecommendedUsers(principal.getId(), limit);
        return ResponseEntity.ok(recommended);
    }

    @GetMapping("/{id}/gift-wall")
    @Operation(summary = "Get a user's received gift wall")
    public ResponseEntity<List<GiftWallItemDto>> getGiftWall(@PathVariable Long id) {
        List<GiftWallItemDto> giftWall = giftService.getGiftWall(id);
        return ResponseEntity.ok(giftWall);
    }
}
