package com.partyvibe.controller;

import com.partyvibe.config.UserPrincipal;
import com.partyvibe.dto.UserSummaryDto;
import com.partyvibe.service.FollowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Follows", description = "Follow, unfollow and friends system")
public class FollowController {

    private final FollowService followService;

    @PostMapping("/{id}/follow")
    @Operation(summary = "Toggle follow/unfollow a user")
    public ResponseEntity<Map<String, Boolean>> toggleFollow(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        boolean following = followService.toggleFollow(principal.getId(), id);
        return ResponseEntity.ok(Collections.singletonMap("following", following));
    }

    @GetMapping("/{id}/followers")
    @Operation(summary = "Get user followers list")
    public ResponseEntity<List<UserSummaryDto>> getFollowers(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long currentUserId = principal != null ? principal.getId() : null;
        List<UserSummaryDto> followers = followService.getFollowers(id, currentUserId, page, size);
        return ResponseEntity.ok(followers);
    }

    @GetMapping("/{id}/following")
    @Operation(summary = "Get user following list")
    public ResponseEntity<List<UserSummaryDto>> getFollowing(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long currentUserId = principal != null ? principal.getId() : null;
        List<UserSummaryDto> following = followService.getFollowing(id, currentUserId, page, size);
        return ResponseEntity.ok(following);
    }

    @GetMapping("/{id}/friends")
    @Operation(summary = "Get mutual friends list")
    public ResponseEntity<List<UserSummaryDto>> getFriends(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long currentUserId = principal != null ? principal.getId() : null;
        List<UserSummaryDto> friends = followService.getFriends(id, currentUserId, page, size);
        return ResponseEntity.ok(friends);
    }
}
