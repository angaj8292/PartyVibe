package com.partyvibe.service;

import com.partyvibe.dto.ConversationSummaryDTO;
import com.partyvibe.dto.DirectMessageDTO;
import com.partyvibe.dto.SendDirectMessageRequest;
import com.partyvibe.exception.BadRequestException;
import com.partyvibe.exception.ResourceNotFoundException;
import com.partyvibe.model.DirectMessage;
import com.partyvibe.model.User;
import com.partyvibe.repository.BlockRepository;
import com.partyvibe.repository.DirectMessageRepository;
import com.partyvibe.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class DirectMessageService {

    private final DirectMessageRepository directMessageRepository;
    private final UserRepository userRepository;
    private final BlockRepository blockRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public DirectMessageDTO sendMessage(Long senderId, Long receiverId, SendDirectMessageRequest req) {
        if (senderId.equals(receiverId)) {
            throw new BadRequestException("You cannot send a direct message to yourself");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found"));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new ResourceNotFoundException("Receiver not found"));

        if (blockRepository.isBlockedEitherWay(senderId, receiverId)) {
            throw new BadRequestException("Cannot send message: A block exists between you and this user");
        }

        DirectMessage message = DirectMessage.builder()
                .sender(sender)
                .receiver(receiver)
                .content(req.getContent().trim())
                .isRead(false)
                .build();

        DirectMessage saved = directMessageRepository.save(message);

        DirectMessageDTO dto = mapToDTO(saved);

        // Real-time broadcast to receiver's private topic & user destination
        try {
            messagingTemplate.convertAndSend("/topic/user." + receiverId + ".messages", dto);
            messagingTemplate.convertAndSendToUser(receiver.getUsername(), "/queue/messages", dto);
            log.debug("Sent direct message STOMP event to receiver {}", receiver.getUsername());
        } catch (Exception e) {
            log.warn("Failed to dispatch real-time DM STOMP notification: {}", e.getMessage());
        }

        return dto;
    }

    @Transactional
    public List<DirectMessageDTO> getConversation(Long currentUserId, Long targetUserId) {
        if (!userRepository.existsById(targetUserId)) {
            throw new ResourceNotFoundException("User not found");
        }

        // Mark any messages received from targetUserId as read
        directMessageRepository.markConversationAsRead(currentUserId, targetUserId);

        List<DirectMessage> history = directMessageRepository.findConversationHistory(currentUserId, targetUserId);
        return history.stream().map(this::mapToDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<ConversationSummaryDTO> getRecentConversations(Long currentUserId) {
        List<Long> partnerIds = directMessageRepository.findDistinctPartnerIds(currentUserId);
        List<ConversationSummaryDTO> summaries = new ArrayList<>();

        for (Long partnerId : partnerIds) {
            Optional<User> partnerOpt = userRepository.findById(partnerId);
            if (partnerOpt.isEmpty()) continue;
            User partner = partnerOpt.get();

            List<DirectMessage> latestList = directMessageRepository.findLatestMessage(
                    currentUserId, partnerId, PageRequest.of(0, 1)
            );

            if (!latestList.isEmpty()) {
                DirectMessage latest = latestList.get(0);
                long unread = directMessageRepository.countUnreadFromPartner(currentUserId, partnerId);
                boolean isFromMe = latest.getSender().getId().equals(currentUserId);

                summaries.add(ConversationSummaryDTO.builder()
                        .partnerId(partner.getId())
                        .partnerUsername(partner.getUsername())
                        .partnerAvatarUrl(partner.getAvatarUrl())
                        .partnerVipLevel(partner.getVipLevel())
                        .partnerBio(partner.getBio())
                        .lastMessageContent(latest.getContent())
                        .lastMessageTime(latest.getCreatedAt())
                        .unreadCount(unread)
                        .isLastMessageFromMe(isFromMe)
                        .build());
            }
        }

        // Sort descending by latest message time
        summaries.sort((a, b) -> {
            if (a.getLastMessageTime() == null && b.getLastMessageTime() == null) return 0;
            if (a.getLastMessageTime() == null) return 1;
            if (b.getLastMessageTime() == null) return -1;
            return b.getLastMessageTime().compareTo(a.getLastMessageTime());
        });

        return summaries;
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long currentUserId) {
        return directMessageRepository.countTotalUnread(currentUserId);
    }

    @Transactional
    public void markAsRead(Long currentUserId, Long targetUserId) {
        directMessageRepository.markConversationAsRead(currentUserId, targetUserId);
    }

    private DirectMessageDTO mapToDTO(DirectMessage m) {
        return DirectMessageDTO.builder()
                .id(m.getId())
                .senderId(m.getSender().getId())
                .senderUsername(m.getSender().getUsername())
                .senderAvatarUrl(m.getSender().getAvatarUrl())
                .senderVipLevel(m.getSender().getVipLevel())
                .receiverId(m.getReceiver().getId())
                .receiverUsername(m.getReceiver().getUsername())
                .receiverAvatarUrl(m.getReceiver().getAvatarUrl())
                .receiverVipLevel(m.getReceiver().getVipLevel())
                .content(m.getContent())
                .isRead(m.isRead())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
