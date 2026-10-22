package com.partyvibe.service;

import com.partyvibe.dto.*;
import com.partyvibe.exception.BadRequestException;
import com.partyvibe.exception.ResourceNotFoundException;
import com.partyvibe.exception.RoomBannedException;
import com.partyvibe.model.*;
import com.partyvibe.repository.*;
import com.partyvibe.websocket.RoomEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomSeatRepository seatRepository;
    private final RoomParticipantRepository participantRepository;
    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final SeatService seatService;
    private final SafetyService safetyService;
    private final LiveKitService liveKitService;
    private final UserMapper userMapper;
    private final RoomEventPublisher eventPublisher;

    @Transactional
    public RoomDto createRoom(Long ownerId, CreateRoomRequest req) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String coverUrl = req.getCoverUrl() != null && !req.getCoverUrl().isBlank()
                ? req.getCoverUrl()
                : "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80";

        Room room = Room.builder()
                .title(req.getTitle().trim())
                .category(req.getCategory().trim())
                .isPublic(req.isPublic())
                .password(req.isPublic() ? null : req.getPassword())
                .owner(owner)
                .coverUrl(coverUrl)
                .active(true)
                .build();

        room = roomRepository.save(room);

        // Initialize 8 seats for the room
        List<RoomSeat> seats = new ArrayList<>();
        for (int i = 1; i <= 8; i++) {
            RoomSeat seat = RoomSeat.builder()
                    .room(room)
                    .seatNo(i)
                    .user(i == 1 ? owner : null) // Host automatically takes Seat 1
                    .locked(false)
                    .muted(false)
                    .build();
            seats.add(seat);
        }
        seatRepository.saveAll(seats);

        // Record owner as first active participant
        RoomParticipant participant = RoomParticipant.builder()
                .room(room)
                .user(owner)
                .joinedAt(Instant.now())
                .build();
        participantRepository.save(participant);

        log.info("Created party room: ID={}, title={}, owner={}", room.getId(), room.getTitle(), owner.getUsername());
        return toDto(room);
    }

    @Transactional(readOnly = true)
    public List<RoomDto> getTrendingRooms(String category, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        List<Room> rooms;
        if (category != null && !category.equalsIgnoreCase("all") && !category.isBlank()) {
            rooms = roomRepository.findByActiveTrueAndCategoryIgnoreCaseOrderByCreatedAtDesc(category, pageRequest);
        } else {
            rooms = roomRepository.findByActiveTrueOrderByCreatedAtDesc(pageRequest);
        }

        return rooms.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RoomDto> getFollowingRooms(Long currentUserId, int page, int size) {
        List<Long> followedIds = followRepository.findFolloweeIdsByFollowerId(currentUserId);
        if (followedIds.isEmpty()) {
            return List.of();
        }

        return roomRepository.findRoomsWithFollowedUsers(followedIds, PageRequest.of(page, size))
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RoomDetailsDto getRoomDetails(Long roomId, Long currentUserId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));

        if (!room.isActive()) {
            throw new BadRequestException("Room is no longer active");
        }

        boolean isBanned = currentUserId != null && safetyService.isUserBannedFromRoom(roomId, currentUserId);
        boolean isOwner = currentUserId != null && room.getOwner().getId().equals(currentUserId);

        List<RoomSeatDto> seats = seatService.getRoomSeats(roomId, currentUserId);

        List<RoomParticipant> participants = participantRepository.findActiveByRoomId(roomId);
        List<UserSummaryDto> viewers = participants.stream()
                .map(p -> userMapper.toSummaryDto(p.getUser(), currentUserId))
                .collect(Collectors.toList());

        Integer currentSeatNo = null;
        boolean isMutedOnSeat = false;

        if (currentUserId != null) {
            for (RoomSeatDto s : seats) {
                if (s.getUser() != null && s.getUser().getId().equals(currentUserId)) {
                    currentSeatNo = s.getSeatNo();
                    isMutedOnSeat = s.isMuted();
                    break;
                }
            }
        }

        MusicStateDto musicState = MusicStateDto.builder()
                .roomId(roomId)
                .musicTitle(room.getCurrentMusicTitle())
                .musicUrl(room.getCurrentMusicUrl())
                .musicPlaying(room.isMusicPlaying())
                .positionMs(room.getMusicPositionMs())
                .timestamp(Instant.now())
                .build();

        return RoomDetailsDto.builder()
                .room(toDto(room))
                .seats(seats)
                .viewers(viewers)
                .viewerCount(participants.size())
                .isOwner(isOwner)
                .isBanned(isBanned)
                .currentSeatNo(currentSeatNo)
                .isMutedOnSeat(isMutedOnSeat)
                .musicState(musicState)
                .build();
    }

    @Transactional
    public RoomDetailsDto joinRoom(Long roomId, Long currentUserId, String password) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));

        if (!room.isActive()) {
            throw new BadRequestException("Room is not active");
        }

        if (safetyService.isUserBannedFromRoom(roomId, currentUserId)) {
            throw new RoomBannedException("You are banned from this room by the host");
        }

        if (!room.isPublic()) {
            if (room.getPassword() != null && !room.getPassword().equals(password)) {
                throw new BadRequestException("Incorrect room password");
            }
        }

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // If not already active in this room, record entry
        boolean alreadyInRoom = participantRepository.findByRoomIdAndUserIdAndLeftAtIsNull(roomId, currentUserId).isPresent();
        if (!alreadyInRoom) {
            RoomParticipant participant = RoomParticipant.builder()
                    .room(room)
                    .user(user)
                    .joinedAt(Instant.now())
                    .build();
            participantRepository.save(participant);

            // Broadcast user joined and viewer count update
            long viewerCount = participantRepository.countByRoomIdAndLeftAtIsNull(roomId);
            eventPublisher.broadcastToRoom(roomId, "VIEWER_COUNT", viewerCount);
            eventPublisher.broadcastToRoom(roomId, "USER_JOINED", userMapper.toSummaryDto(user, null));
        }

        return getRoomDetails(roomId, currentUserId);
    }

    @Transactional
    public void leaveRoom(Long roomId, Long currentUserId) {
        // If seated, vacate seat
        seatService.leaveSeat(currentUserId, roomId);

        participantRepository.findByRoomIdAndUserIdAndLeftAtIsNull(roomId, currentUserId).ifPresent(p -> {
            p.setLeftAt(Instant.now());
            participantRepository.save(p);

            long viewerCount = participantRepository.countByRoomIdAndLeftAtIsNull(roomId);
            eventPublisher.broadcastToRoom(roomId, "VIEWER_COUNT", viewerCount);

            userRepository.findById(currentUserId).ifPresent(user -> {
                eventPublisher.broadcastToRoom(roomId, "USER_LEFT", userMapper.toSummaryDto(user, null));
            });
        });
    }

    @Transactional(readOnly = true)
    public LiveKitTokenResponse getLiveKitToken(Long roomId, Long currentUserId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));

        if (safetyService.isUserBannedFromRoom(roomId, currentUserId)) {
            throw new RoomBannedException("Banned from room");
        }

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // LiveKit Publish permission ONLY for users who currently hold a seat
        boolean isSeated = seatService.isUserOnSeat(roomId, currentUserId);
        boolean canPublish = isSeated;

        String roomName = "partyvibe-room-" + roomId;
        String identity = "user-" + user.getId();
        String token = liveKitService.createToken(roomName, identity, user.getUsername(), canPublish);

        return LiveKitTokenResponse.builder()
                .token(token)
                .livekitUrl(liveKitService.getLivekitUrl())
                .roomName(roomName)
                .identity(identity)
                .canPublish(canPublish)
                .canSubscribe(true)
                .build();
    }

    @Transactional
    public MusicStateDto updateMusicState(Long roomId, Long currentUserId, MusicActionRequest req) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));

        boolean isOwner = room.getOwner().getId().equals(currentUserId);
        boolean isSeated = seatService.isUserOnSeat(roomId, currentUserId);

        if (!isOwner && !isSeated) {
            throw new BadRequestException("Only room host or seated members can control music");
        }

        switch (req.getAction()) {
            case PLAY -> {
                room.setMusicPlaying(true);
                if (req.getMusicTitle() != null) room.setCurrentMusicTitle(req.getMusicTitle());
                if (req.getMusicUrl() != null) room.setCurrentMusicUrl(req.getMusicUrl());
                if (req.getPositionMs() != null) room.setMusicPositionMs(req.getPositionMs());
            }
            case PAUSE -> {
                room.setMusicPlaying(false);
                if (req.getPositionMs() != null) room.setMusicPositionMs(req.getPositionMs());
            }
            case CHANGE -> {
                room.setMusicPlaying(true);
                room.setCurrentMusicTitle(req.getMusicTitle());
                room.setCurrentMusicUrl(req.getMusicUrl());
                room.setMusicPositionMs(req.getPositionMs() != null ? req.getPositionMs() : 0L);
            }
            case STOP -> {
                room.setMusicPlaying(false);
                room.setMusicPositionMs(0L);
            }
        }

        room = roomRepository.save(room);

        MusicStateDto musicDto = MusicStateDto.builder()
                .roomId(roomId)
                .musicTitle(room.getCurrentMusicTitle())
                .musicUrl(room.getCurrentMusicUrl())
                .musicPlaying(room.isMusicPlaying())
                .positionMs(room.getMusicPositionMs())
                .timestamp(Instant.now())
                .build();

        eventPublisher.broadcastToRoom(roomId, "MUSIC_UPDATED", musicDto);
        return musicDto;
    }

    @Transactional
    public MusicStateDto uploadMusic(Long roomId, Long currentUserId, MultipartFile file, String title) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));

        boolean isOwner = room.getOwner().getId().equals(currentUserId);
        boolean isSeated = seatService.isUserOnSeat(roomId, currentUserId);

        if (!isOwner && !isSeated) {
            throw new BadRequestException("Only room host or seated members can upload music");
        }

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Audio file cannot be empty");
        }

        try {
            Path uploadDir = Paths.get("uploads", "music").toAbsolutePath().normalize();
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            String originalFilename = file.getOriginalFilename();
            String extension = ".mp3";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String trackTitle = (title != null && !title.isBlank()) ? title.trim()
                    : (originalFilename != null ? originalFilename.replaceFirst("[.][^.]+$", "") : "Uploaded Track");

            String filename = "music_room" + roomId + "_" + System.currentTimeMillis() + extension;
            Path targetPath = uploadDir.resolve(filename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String musicUrl = "/uploads/music/" + filename;
            room.setMusicPlaying(true);
            room.setCurrentMusicTitle(trackTitle);
            room.setCurrentMusicUrl(musicUrl);
            room.setMusicPositionMs(0L);

            room = roomRepository.save(room);

            MusicStateDto musicDto = MusicStateDto.builder()
                    .roomId(roomId)
                    .musicTitle(room.getCurrentMusicTitle())
                    .musicUrl(room.getCurrentMusicUrl())
                    .musicPlaying(room.isMusicPlaying())
                    .positionMs(room.getMusicPositionMs())
                    .timestamp(Instant.now())
                    .build();

            eventPublisher.broadcastToRoom(roomId, "MUSIC_UPDATED", musicDto);
            log.info("Uploaded music track '{}' for room ID {}", trackTitle, roomId);
            return musicDto;
        } catch (IOException e) {
            log.error("Failed to store music file for room " + roomId, e);
            throw new RuntimeException("Failed to save audio file: " + e.getMessage());
        }
    }

    public RoomDto toDto(Room room) {
        long listenerCount = participantRepository.countByRoomIdAndLeftAtIsNull(room.getId());
        long occupiedSeats = seatRepository.countByRoomIdAndUserIsNotNull(room.getId());
        int seatsLeft = Math.max(0, 8 - (int) occupiedSeats);

        return RoomDto.builder()
                .id(room.getId())
                .title(room.getTitle())
                .category(room.getCategory())
                .isPublic(room.isPublic())
                .hasPassword(room.getPassword() != null && !room.getPassword().isBlank())
                .owner(userMapper.toSummaryDto(room.getOwner(), null))
                .active(room.isActive())
                .coverUrl(room.getCoverUrl())
                .listenerCount(listenerCount)
                .occupiedSeatsCount(occupiedSeats)
                .seatsLeft(seatsLeft)
                .currentMusicTitle(room.getCurrentMusicTitle())
                .currentMusicUrl(room.getCurrentMusicUrl())
                .musicPlaying(room.isMusicPlaying())
                .musicPositionMs(room.getMusicPositionMs())
                .createdAt(room.getCreatedAt())
                .build();
    }
}
