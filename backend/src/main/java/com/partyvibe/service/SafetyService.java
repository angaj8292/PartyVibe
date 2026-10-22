package com.partyvibe.service;

import com.partyvibe.dto.ReportRequest;
import com.partyvibe.dto.UserSummaryDto;
import com.partyvibe.exception.BadRequestException;
import com.partyvibe.exception.ResourceNotFoundException;
import com.partyvibe.model.*;
import com.partyvibe.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SafetyService {

    private final ReportRepository reportRepository;
    private final BlockRepository blockRepository;
    private final RoomBanRepository roomBanRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final UserMapper userMapper;

    // Common profanity words list for chat filter
    private static final Set<String> PROFANITY_WORDS = new HashSet<>(Arrays.asList(
            "badword", "spam", "scam", "idiot", "stupid", "fuck", "shit", "bitch", "asshole",
            "dick", "bastard", "crap", "cunt", "damn", "porn", "nude", "nazi", "terrorist"
    ));

    @Transactional
    public Report createReport(Long reporterId, ReportRequest req) {
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new ResourceNotFoundException("Reporter user not found"));

        User reportedUser = null;
        if (req.getReportedUserId() != null) {
            reportedUser = userRepository.findById(req.getReportedUserId()).orElse(null);
        }

        Room reportedRoom = null;
        if (req.getReportedRoomId() != null) {
            reportedRoom = roomRepository.findById(req.getReportedRoomId()).orElse(null);
        }

        if (reportedUser == null && reportedRoom == null) {
            throw new BadRequestException("Must report either a user or a room");
        }

        Report report = Report.builder()
                .reporter(reporter)
                .reportedUser(reportedUser)
                .reportedRoom(reportedRoom)
                .reason(req.getReason())
                .description(req.getDescription())
                .status("PENDING")
                .createdAt(Instant.now())
                .build();

        log.info("User {} filed report: reason={}, user={}, room={}",
                reporterId, req.getReason(), req.getReportedUserId(), req.getReportedRoomId());
        return reportRepository.save(report);
    }

    @Transactional
    public boolean blockUser(Long blockerId, Long targetUserId) {
        if (blockerId.equals(targetUserId)) {
            throw new BadRequestException("You cannot block yourself");
        }

        User blocker = userRepository.findById(blockerId)
                .orElseThrow(() -> new ResourceNotFoundException("Blocker not found"));
        User blocked = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User to block not found"));

        if (blockRepository.existsByBlockerIdAndBlockedId(blockerId, targetUserId)) {
            return true; // Already blocked
        }

        Block block = Block.builder()
                .blocker(blocker)
                .blocked(blocked)
                .createdAt(Instant.now())
                .build();
        blockRepository.save(block);
        log.info("User {} blocked user {}", blockerId, targetUserId);
        return true;
    }

    @Transactional
    public boolean unblockUser(Long blockerId, Long targetUserId) {
        blockRepository.deleteByBlockerIdAndBlockedId(blockerId, targetUserId);
        log.info("User {} unblocked user {}", blockerId, targetUserId);
        return true;
    }

    @Transactional(readOnly = true)
    public boolean isBlocked(Long user1Id, Long user2Id) {
        return blockRepository.isBlockedEitherWay(user1Id, user2Id);
    }

    @Transactional(readOnly = true)
    public List<UserSummaryDto> getBlockedUsers(Long userId, int page, int size) {
        return blockRepository.findBlockedUsersByBlockerId(userId, PageRequest.of(page, size))
                .stream()
                .map(u -> userMapper.toSummaryDto(u, userId))
                .collect(Collectors.toList());
    }

    @Transactional
    public void banUserFromRoom(Long ownerId, Long roomId, Long targetUserId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));

        if (!room.getOwner().getId().equals(ownerId)) {
            throw new BadRequestException("Only room owner can ban users");
        }
        if (ownerId.equals(targetUserId)) {
            throw new BadRequestException("Cannot ban room owner");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Target user not found"));

        if (!roomBanRepository.existsByRoomIdAndUserId(roomId, targetUserId)) {
            RoomBan ban = RoomBan.builder()
                    .room(room)
                    .user(targetUser)
                    .bannedAt(Instant.now())
                    .build();
            roomBanRepository.save(ban);
            log.info("Owner {} banned user {} from room {}", ownerId, targetUserId, roomId);
        }
    }

    @Transactional
    public void unbanUserFromRoom(Long ownerId, Long roomId, Long targetUserId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));

        if (!room.getOwner().getId().equals(ownerId)) {
            throw new BadRequestException("Only room owner can unban users");
        }

        roomBanRepository.deleteByRoomIdAndUserId(roomId, targetUserId);
        log.info("Owner {} unbanned user {} from room {}", ownerId, targetUserId, roomId);
    }

    @Transactional(readOnly = true)
    public boolean isUserBannedFromRoom(Long roomId, Long userId) {
        return roomBanRepository.existsByRoomIdAndUserId(roomId, userId);
    }

    /**
     * Filters profanity words by masking them with asterisks (*).
     */
    public String sanitizeChatMessage(String text) {
        if (text == null) return "";
        String result = text;
        for (String word : PROFANITY_WORDS) {
            Pattern p = Pattern.compile("(?i)\\b" + Pattern.quote(word) + "\\b");
            result = p.matcher(result).replaceAll("*".repeat(word.length()));
        }
        return result;
    }
}
