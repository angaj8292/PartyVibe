package com.partyvibe.service;

import com.partyvibe.dto.*;
import com.partyvibe.exception.BadRequestException;
import com.partyvibe.exception.ResourceNotFoundException;
import com.partyvibe.model.*;
import com.partyvibe.repository.*;
import com.partyvibe.websocket.RoomEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GiftService {

    private final GiftRepository giftRepository;
    private final GiftTransactionRepository giftTransactionRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final RoomMessageRepository roomMessageRepository;
    private final WalletService walletService;
    private final SafetyService safetyService;
    private final UserMapper userMapper;
    private final RoomEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public List<GiftDto> getGifts() {
        return giftRepository.findAllByOrderByCoinPriceAsc()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public GiftEventDto sendGift(Long senderId, SendGiftRequest req) {
        if (senderId.equals(req.getReceiverId())) {
            throw new BadRequestException("You cannot send a gift to yourself");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found"));
        User receiver = userRepository.findById(req.getReceiverId())
                .orElseThrow(() -> new ResourceNotFoundException("Receiver not found"));

        if (safetyService.isBlocked(senderId, req.getReceiverId())) {
            throw new BadRequestException("Cannot interact with a blocked user");
        }

        Gift gift = giftRepository.findById(req.getGiftId())
                .orElseThrow(() -> new ResourceNotFoundException("Gift not found"));

        Room room = null;
        if (req.getRoomId() != null) {
            room = roomRepository.findById(req.getRoomId())
                    .orElseThrow(() -> new ResourceNotFoundException("Room not found"));
            if (safetyService.isUserBannedFromRoom(room.getId(), senderId)) {
                throw new BadRequestException("You are banned from this room");
            }
        }

        // 1. Transactionally spend coins from sender (throws InsufficientCoinsException if balance < price)
        String spendDesc = "Sent gift " + gift.getName() + " to " + receiver.getUsername();
        sender = walletService.spendCoins(senderId, gift.getCoinPrice(), spendDesc, "GIFT-" + gift.getId());

        // 2. Credit 50% coins to receiver as diamond/earning balance
        long receiverEarnings = Math.max(1, gift.getCoinPrice() / 2);
        receiver = walletService.creditCoins(receiver.getId(), receiverEarnings,
                "Received gift " + gift.getName() + " from " + sender.getUsername(), "GIFT-REC-" + gift.getId());

        // 3. Save GiftTransaction
        GiftTransaction tx = GiftTransaction.builder()
                .sender(sender)
                .receiver(receiver)
                .gift(gift)
                .room(room)
                .coins(gift.getCoinPrice())
                .createdAt(Instant.now())
                .build();
        tx = giftTransactionRepository.save(tx);

        UserSummaryDto senderSummary = userMapper.toSummaryDto(sender, null);
        UserSummaryDto receiverSummary = userMapper.toSummaryDto(receiver, null);
        GiftDto giftDto = toDto(gift);

        GiftEventDto giftEvent = GiftEventDto.builder()
                .id(tx.getId())
                .sender(senderSummary)
                .receiver(receiverSummary)
                .gift(giftDto)
                .roomId(room != null ? room.getId() : null)
                .coins(gift.getCoinPrice())
                .createdAt(tx.getCreatedAt())
                .build();

        // 4. If in a room, save room chat message and broadcast real-time event to room topic
        if (room != null) {
            String notice = String.format("%s sent %s %s to %s!",
                    sender.getUsername(), gift.getIcon(), gift.getName(), receiver.getUsername());

            RoomMessage msg = RoomMessage.builder()
                    .room(room)
                    .sender(sender)
                    .content(notice)
                    .type(RoomMessage.MessageType.GIFT)
                    .createdAt(Instant.now())
                    .build();
            roomMessageRepository.save(msg);

            ChatMessageDto chatDto = ChatMessageDto.builder()
                    .id(msg.getId())
                    .roomId(room.getId())
                    .sender(senderSummary)
                    .content(notice)
                    .type(RoomMessage.MessageType.GIFT)
                    .createdAt(msg.getCreatedAt())
                    .build();

            // Broadcast GIFT_EVENT and CHAT_MESSAGE to /topic/room.{roomId}
            eventPublisher.broadcastToRoom(room.getId(), "GIFT_SENT", giftEvent);
            eventPublisher.broadcastToRoom(room.getId(), "CHAT_MESSAGE", chatDto);
        }

        log.info("Gift sent: {} -> {}, gift={}, coins={}",
                sender.getUsername(), receiver.getUsername(), gift.getName(), gift.getCoinPrice());

        return giftEvent;
    }

    @Transactional(readOnly = true)
    public List<GiftWallItemDto> getGiftWall(Long userId) {
        return giftTransactionRepository.findGiftWallByReceiverId(userId)
                .stream()
                .map(item -> GiftWallItemDto.builder()
                        .giftId(item.getGiftId())
                        .giftName(item.getGiftName())
                        .icon(item.getIcon())
                        .count(item.getGiftCount())
                        .totalCoins(item.getTotalCoins() != null ? item.getTotalCoins() : 0L)
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GiftEventDto> getUserGiftRecords(Long userId, String type, int limit) {
        Pageable pageable = PageRequest.of(0, Math.min(limit, 100));
        List<GiftTransaction> list;
        if ("sent".equalsIgnoreCase(type)) {
            list = giftTransactionRepository.findBySenderIdOrderByCreatedAtDesc(userId, pageable);
        } else if ("received".equalsIgnoreCase(type)) {
            list = giftTransactionRepository.findByReceiverIdOrderByCreatedAtDesc(userId, pageable);
        } else {
            List<GiftTransaction> sent = giftTransactionRepository.findBySenderIdOrderByCreatedAtDesc(userId, pageable);
            List<GiftTransaction> received = giftTransactionRepository.findByReceiverIdOrderByCreatedAtDesc(userId, pageable);
            List<GiftTransaction> combined = new java.util.ArrayList<>();
            combined.addAll(sent);
            combined.addAll(received);
            combined.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
            list = combined.stream().limit(limit).collect(Collectors.toList());
        }

        return list.stream().map(gt -> GiftEventDto.builder()
                .id(gt.getId())
                .sender(userMapper.toSummaryDto(gt.getSender(), userId))
                .receiver(userMapper.toSummaryDto(gt.getReceiver(), userId))
                .gift(toDto(gt.getGift()))
                .roomId(gt.getRoom() != null ? gt.getRoom().getId() : null)
                .coins(gt.getCoins())
                .createdAt(gt.getCreatedAt())
                .build()
        ).collect(Collectors.toList());
    }

    public GiftDto toDto(Gift gift) {
        return GiftDto.builder()
                .id(gift.getId())
                .name(gift.getName())
                .icon(gift.getIcon())
                .coinPrice(gift.getCoinPrice())
                .animationType(gift.getAnimationType())
                .soundEffect(gift.getSoundEffect())
                .build();
    }
}
