package com.partyvibe.controller;

import com.partyvibe.config.UserPrincipal;
import com.partyvibe.dto.*;
import com.partyvibe.service.ChatService;
import com.partyvibe.service.RoomService;
import com.partyvibe.service.SafetyService;
import com.partyvibe.service.SeatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
@Tag(name = "Rooms", description = "Voice party rooms management and live seat controls")
public class RoomController {

    private final RoomService roomService;
    private final SeatService seatService;
    private final ChatService chatService;
    private final SafetyService safetyService;

    @PostMapping
    @Operation(summary = "Create a new party room")
    public ResponseEntity<RoomDto> createRoom(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateRoomRequest req) {
        RoomDto room = roomService.createRoom(principal.getId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(room);
    }

    @GetMapping
    @Operation(summary = "List trending or category-filtered party rooms")
    public ResponseEntity<List<RoomDto>> getRooms(
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        List<RoomDto> rooms = roomService.getTrendingRooms(category, page, size);
        return ResponseEntity.ok(rooms);
    }

    @GetMapping("/following")
    @Operation(summary = "List rooms where followed users are currently active")
    public ResponseEntity<List<RoomDto>> getFollowingRooms(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        List<RoomDto> rooms = roomService.getFollowingRooms(principal.getId(), page, size);
        return ResponseEntity.ok(rooms);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get party room details by ID")
    public ResponseEntity<RoomDetailsDto> getRoom(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long currentUserId = principal != null ? principal.getId() : null;
        RoomDetailsDto details = roomService.getRoomDetails(id, currentUserId);
        return ResponseEntity.ok(details);
    }

    @PostMapping("/{id}/join")
    @Operation(summary = "Join a party room as a viewer/listener")
    public ResponseEntity<RoomDetailsDto> joinRoom(
            @PathVariable Long id,
            @RequestParam(required = false) String password,
            @AuthenticationPrincipal UserPrincipal principal) {
        RoomDetailsDto details = roomService.joinRoom(id, principal.getId(), password);
        return ResponseEntity.ok(details);
    }

    @PostMapping("/{id}/leave")
    @Operation(summary = "Leave a party room")
    public ResponseEntity<Map<String, String>> leaveRoom(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        roomService.leaveRoom(id, principal.getId());
        return ResponseEntity.ok(Collections.singletonMap("status", "left"));
    }

    @GetMapping("/{id}/livekit-token")
    @Operation(summary = "Get LiveKit access token (publish permission granted only to seated users)")
    public ResponseEntity<LiveKitTokenResponse> getLiveKitToken(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        LiveKitTokenResponse tokenResponse = roomService.getLiveKitToken(id, principal.getId());
        return ResponseEntity.ok(tokenResponse);
    }

    @PostMapping("/{id}/seats")
    @Operation(summary = "Perform seat action (take, leave, lock, mute, kick)")
    public ResponseEntity<List<RoomSeatDto>> seatAction(
            @PathVariable Long id,
            @Valid @RequestBody SeatActionRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<RoomSeatDto> seats = seatService.performSeatAction(principal.getId(), id, req);
        return ResponseEntity.ok(seats);
    }

    @GetMapping("/{id}/messages")
    @Operation(summary = "Get recent chat messages in the room")
    public ResponseEntity<List<ChatMessageDto>> getMessages(
            @PathVariable Long id,
            @RequestParam(defaultValue = "50") int limit) {
        List<ChatMessageDto> messages = chatService.getRecentMessages(id, limit);
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/{id}/messages")
    @Operation(summary = "Send a chat message to the room")
    public ResponseEntity<ChatMessageDto> sendMessage(
            @PathVariable Long id,
            @Valid @RequestBody SendChatRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        ChatMessageDto message = chatService.sendMessage(principal.getId(), id, req);
        return ResponseEntity.ok(message);
    }

    @PostMapping("/{id}/music")
    @Operation(summary = "Control background music playback in the room")
    public ResponseEntity<MusicStateDto> updateMusic(
            @PathVariable Long id,
            @Valid @RequestBody MusicActionRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        MusicStateDto musicState = roomService.updateMusicState(id, principal.getId(), req);
        return ResponseEntity.ok(musicState);
    }

    @PostMapping(value = "/{id}/music/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload and play a local audio file in the party room")
    public ResponseEntity<MusicStateDto> uploadMusic(
            @PathVariable Long id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam(value = "title", required = false) String title,
            @AuthenticationPrincipal UserPrincipal principal) {
        MusicStateDto musicState = roomService.uploadMusic(id, principal.getId(), file, title);
        return ResponseEntity.ok(musicState);
    }

    @PostMapping("/{id}/ban")
    @Operation(summary = "Room owner bans a user from the room")
    public ResponseEntity<Map<String, String>> banUser(
            @PathVariable Long id,
            @Valid @RequestBody BanRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        safetyService.banUserFromRoom(principal.getId(), id, req.getUserId());
        // Also kick them off seats and leave room
        seatService.leaveSeat(req.getUserId(), id);
        roomService.leaveRoom(id, req.getUserId());
        return ResponseEntity.ok(Collections.singletonMap("status", "banned"));
    }

    @DeleteMapping("/{id}/ban/{userId}")
    @Operation(summary = "Room owner unbans a user from the room")
    public ResponseEntity<Map<String, String>> unbanUser(
            @PathVariable Long id,
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal principal) {
        safetyService.unbanUserFromRoom(principal.getId(), id, userId);
        return ResponseEntity.ok(Collections.singletonMap("status", "unbanned"));
    }
}
