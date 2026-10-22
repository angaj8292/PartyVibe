package com.partyvibe.service;

import com.partyvibe.dto.TopUpRequest;
import com.partyvibe.dto.WalletDto;
import com.partyvibe.exception.InsufficientCoinsException;
import com.partyvibe.model.User;
import com.partyvibe.model.WalletTransaction;
import com.partyvibe.repository.UserRepository;
import com.partyvibe.repository.WalletTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WalletServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private WalletTransactionRepository walletTransactionRepository;

    @InjectMocks
    private WalletService walletService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .username("testuser")
                .coinsBalance(500L)
                .totalCoinsSpent(0L)
                .vipLevel(0)
                .build();
    }

    @Test
    @DisplayName("topUp should increase coins balance and save transaction")
    void testTopUpSuccess() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(Pageable.class)))
                .thenReturn(Collections.emptyList());

        TopUpRequest req = TopUpRequest.builder().amount(1000L).paymentMethod("TEST").build();
        WalletDto wallet = walletService.topUp(1L, req);

        assertNotNull(wallet);
        assertEquals(1500L, testUser.getCoinsBalance());
        verify(walletTransactionRepository, times(1)).save(any(WalletTransaction.class));
    }

    @Test
    @DisplayName("spendCoins should deduct coins and recalculate VIP level")
    void testSpendCoinsSuccess() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        User updatedUser = walletService.spendCoins(1L, 200L, "Bought gift", "REF-123");

        assertEquals(300L, updatedUser.getCoinsBalance());
        assertEquals(200L, updatedUser.getTotalCoinsSpent());
        assertEquals(1, updatedUser.getVipLevel()); // 200 coins spent => VIP 1
        verify(walletTransactionRepository, times(1)).save(any(WalletTransaction.class));
    }

    @Test
    @DisplayName("spendCoins should throw InsufficientCoinsException if balance is not enough")
    void testSpendCoinsInsufficient() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        assertThrows(InsufficientCoinsException.class, () -> {
            walletService.spendCoins(1L, 1000L, "Too expensive", "REF-999");
        });

        assertEquals(500L, testUser.getCoinsBalance());
        verify(walletTransactionRepository, never()).save(any(WalletTransaction.class));
    }
}
