package com.partyvibe.controller;

import com.partyvibe.config.UserPrincipal;
import com.partyvibe.dto.ConversationSummaryDTO;
import com.partyvibe.dto.DirectMessageDTO;
import com.partyvibe.dto.SendDirectMessageRequest;
import com.partyvibe.service.DirectMessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@Tag(name = "Direct Messages", description = "One-on-one direct chat and conversations")
public class DirectMessageController {

    private final DirectMessageService directMessageService;

    @PostMapping("/user/{targetUserId}")
    @Operation(summary = "Send a direct message to a user")
    public ResponseEntity<DirectMessageDTO> sendMessage(
            @PathVariable Long targetUserId,
            @Valid @RequestBody SendDirectMessageRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        DirectMessageDTO response = directMessageService.sendMessage(principal.getId(), targetUserId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{targetUserId}")
    @Operation(summary = "Get conversation message history with a specific user")
    public ResponseEntity<List<DirectMessageDTO>> getConversation(
            @PathVariable Long targetUserId,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<DirectMessageDTO> messages = directMessageService.getConversation(principal.getId(), targetUserId);
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/conversations")
    @Operation(summary = "Get all recent direct message conversations with unread counts")
    public ResponseEntity<List<ConversationSummaryDTO>> getRecentConversations(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<ConversationSummaryDTO> conversations = directMessageService.getRecentConversations(principal.getId());
        return ResponseEntity.ok(conversations);
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get total count of unread direct messages")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal principal) {
        long count = directMessageService.getUnreadCount(principal.getId());
        return ResponseEntity.ok(Collections.singletonMap("unreadCount", count));
    }

    @PostMapping("/user/{targetUserId}/read")
    @Operation(summary = "Mark conversation messages with a user as read")
    public ResponseEntity<Map<String, Boolean>> markAsRead(
            @PathVariable Long targetUserId,
            @AuthenticationPrincipal UserPrincipal principal) {
        directMessageService.markAsRead(principal.getId(), targetUserId);
        return ResponseEntity.ok(Collections.singletonMap("success", true));
    }
}
