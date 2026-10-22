package com.partyvibe.service;

import com.partyvibe.dto.GiftEventDto;
import com.partyvibe.dto.SendGiftRequest;
import com.partyvibe.dto.UserSummaryDto;
import com.partyvibe.exception.BadRequestException;
import com.partyvibe.exception.InsufficientCoinsException;
import com.partyvibe.model.Gift;
import com.partyvibe.model.GiftTransaction;
import com.partyvibe.model.Room;
import com.partyvibe.model.User;
import com.partyvibe.repository.GiftRepository;
import com.partyvibe.repository.GiftTransactionRepository;
import com.partyvibe.repository.RoomMessageRepository;
import com.partyvibe.repository.RoomRepository;
import com.partyvibe.repository.UserRepository;
import com.partyvibe.websocket.RoomEventPublisher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GiftServiceTest {

    @Mock
    private GiftRepository giftRepository;

    @Mock
    private GiftTransactionRepository giftTransactionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private RoomMessageRepository roomMessageRepository;

    @Mock
    private WalletService walletService;

    @Mock
    private SafetyService safetyService;

    @Mock
    private UserMapper userMapper;

    @Mock
    private RoomEventPublisher eventPublisher;

    @InjectMocks
    private GiftService giftService;

    private User sender;
    private User receiver;
    private Gift roseGift;
    private Room room;

    @BeforeEach
    void setUp() {
        sender = User.builder().id(1L).username("alice").coinsBalance(500L).build();
        receiver = User.builder().id(2L).username("bob").coinsBalance(100L).build();
        roseGift = Gift.builder().id(10L).name("Rose").coinPrice(10).icon("🌹").animationType("FLOAT").build();
        room = Room.builder().id(100L).title("Chill Lounge").active(true).build();
    }

    @Test
    @DisplayName("sendGift should deduct coins, credit receiver, record transaction, and broadcast")
    void testSendGiftSuccess() {
        SendGiftRequest req = SendGiftRequest.builder()
                .giftId(10L)
                .receiverId(2L)
                .roomId(100L)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sender));
        when(userRepository.findById(2L)).thenReturn(Optional.of(receiver));
        when(safetyService.isBlocked(1L, 2L)).thenReturn(false);
        when(giftRepository.findById(10L)).thenReturn(Optional.of(roseGift));
        when(roomRepository.findById(100L)).thenReturn(Optional.of(room));
        when(safetyService.isUserBannedFromRoom(100L, 1L)).thenReturn(false);

        when(walletService.spendCoins(eq(1L), eq(10L), anyString(), anyString())).thenReturn(sender);
        when(walletService.creditCoins(eq(2L), eq(5L), anyString(), anyString())).thenReturn(receiver);

        when(giftTransactionRepository.save(any(GiftTransaction.class))).thenAnswer(i -> {
            GiftTransaction tx = i.getArgument(0);
            tx.setId(999L);
            return tx;
        });

        UserSummaryDto senderSummary = UserSummaryDto.builder().id(1L).username("alice").build();
        UserSummaryDto receiverSummary = UserSummaryDto.builder().id(2L).username("bob").build();
        when(userMapper.toSummaryDto(sender, null)).thenReturn(senderSummary);
        when(userMapper.toSummaryDto(receiver, null)).thenReturn(receiverSummary);

        GiftEventDto result = giftService.sendGift(1L, req);

        assertNotNull(result);
        assertEquals(10L, result.getCoins());
        assertEquals("Rose", result.getGift().getName());
        verify(walletService, times(1)).spendCoins(eq(1L), eq(10L), anyString(), anyString());
        verify(walletService, times(1)).creditCoins(eq(2L), eq(5L), anyString(), anyString());
        verify(eventPublisher, times(1)).broadcastToRoom(eq(100L), eq("GIFT_SENT"), any());
    }

    @Test
    @DisplayName("sendGift to self should throw BadRequestException")
    void testSendGiftToSelf() {
        SendGiftRequest req = SendGiftRequest.builder().giftId(10L).receiverId(1L).build();
        assertThrows(BadRequestException.class, () -> giftService.sendGift(1L, req));
    }

    @Test
    @DisplayName("sendGift should propagate InsufficientCoinsException if balance is low")
    void testSendGiftInsufficientCoins() {
        SendGiftRequest req = SendGiftRequest.builder().giftId(10L).receiverId(2L).build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sender));
        when(userRepository.findById(2L)).thenReturn(Optional.of(receiver));
        when(safetyService.isBlocked(1L, 2L)).thenReturn(false);
        when(giftRepository.findById(10L)).thenReturn(Optional.of(roseGift));

        doThrow(new InsufficientCoinsException("Not enough coins"))
                .when(walletService).spendCoins(eq(1L), eq(10L), anyString(), anyString());

        assertThrows(InsufficientCoinsException.class, () -> giftService.sendGift(1L, req));
    }
}
