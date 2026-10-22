package com.partyvibe.service;

import com.partyvibe.dto.ChatMessageDto;
import com.partyvibe.dto.SendChatRequest;
import com.partyvibe.dto.UserSummaryDto;
import com.partyvibe.exception.BadRequestException;
import com.partyvibe.exception.ResourceNotFoundException;
import com.partyvibe.model.Room;
import com.partyvibe.model.RoomMessage;
import com.partyvibe.model.User;
import com.partyvibe.repository.RoomMessageRepository;
import com.partyvibe.repository.RoomRepository;
import com.partyvibe.repository.UserRepository;
import com.partyvibe.websocket.RoomEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final RoomMessageRepository messageRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final SafetyService safetyService;
    private final UserMapper userMapper;
    private final RoomEventPublisher eventPublisher;

    @Transactional
    public ChatMessageDto sendMessage(Long senderId, Long roomId, SendChatRequest req) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));

        if (!room.isActive()) {
            throw new BadRequestException("Room is not active");
        }

        if (safetyService.isUserBannedFromRoom(roomId, senderId)) {
            throw new BadRequestException("You are banned from this room");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found"));

        // Profanity filter applied
        String sanitized = safetyService.sanitizeChatMessage(req.getContent().trim());

        RoomMessage message = RoomMessage.builder()
                .room(room)
                .sender(sender)
                .content(sanitized)
                .type(RoomMessage.MessageType.CHAT)
                .createdAt(Instant.now())
                .build();

        message = messageRepository.save(message);

        UserSummaryDto senderSummary = userMapper.toSummaryDto(sender, null);
        ChatMessageDto dto = ChatMessageDto.builder()
                .id(message.getId())
                .roomId(roomId)
                .sender(senderSummary)
                .content(message.getContent())
                .type(message.getType())
                .createdAt(message.getCreatedAt())
                .build();

        // Broadcast to WebSocket subscribers of this room
        eventPublisher.broadcastToRoom(roomId, "CHAT_MESSAGE", dto);
        return dto;
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> getRecentMessages(Long roomId, int limit) {
        return messageRepository.findRecentMessagesByRoomId(roomId, PageRequest.of(0, limit))
                .stream()
                .map(m -> ChatMessageDto.builder()
                        .id(m.getId())
                        .roomId(roomId)
                        .sender(m.getSender() != null ? userMapper.toSummaryDto(m.getSender(), null) : null)
                        .content(m.getContent())
                        .type(m.getType())
                        .createdAt(m.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }
}
