package com.partyvibe.service;

import com.partyvibe.dto.TopUpRequest;
import com.partyvibe.dto.WalletDto;
import com.partyvibe.dto.WalletTransactionDto;
import com.partyvibe.exception.BadRequestException;
import com.partyvibe.exception.InsufficientCoinsException;
import com.partyvibe.exception.ResourceNotFoundException;
import com.partyvibe.model.User;
import com.partyvibe.model.WalletTransaction;
import com.partyvibe.repository.UserRepository;
import com.partyvibe.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WalletService {

    private final UserRepository userRepository;
    private final WalletTransactionRepository walletTransactionRepository;

    @Transactional(readOnly = true)
    public WalletDto getWallet(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<WalletTransactionDto> txs = walletTransactionRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, 20))
                .stream()
                .map(this::toTxDto)
                .collect(Collectors.toList());

        return WalletDto.builder()
                .coinsBalance(user.getCoinsBalance())
                .totalCoinsSpent(user.getTotalCoinsSpent())
                .vipLevel(user.getVipLevel())
                .recentTransactions(txs)
                .build();
    }

    /**
     * Top-up coins (Supports test coins or external payment gateway webhook like Razorpay).
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public WalletDto topUp(Long userId, TopUpRequest req) {
        if (req.getAmount() <= 0) {
            throw new BadRequestException("Top-up amount must be greater than zero");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        long newBalance = user.getCoinsBalance() + req.getAmount();
        user.setCoinsBalance(newBalance);
        userRepository.save(user);

        String refId = req.getPaymentReference() != null ? req.getPaymentReference() : "TOPUP-" + UUID.randomUUID().toString().substring(0, 8);
        String method = req.getPaymentMethod() != null ? req.getPaymentMethod() : "Test Top-up";
        String desc = "Coins Top-up via " + method;
        if (req.getPrice() != null) {
            String curr = req.getCurrency() != null ? req.getCurrency() : "INR";
            desc += String.format(" (%s %.2f)", curr, req.getPrice());
        }

        WalletTransaction tx = WalletTransaction.builder()
                .user(user)
                .amount(req.getAmount())
                .balanceAfter(newBalance)
                .type(WalletTransaction.TransactionType.TOPUP)
                .referenceId(refId)
                .description(desc)
                .createdAt(Instant.now())
                .build();
        walletTransactionRepository.save(tx);

        log.info("User {} topped up {} coins. New balance: {}", userId, req.getAmount(), newBalance);
        return getWallet(userId);
    }

    /**
     * Transactional coin spending. Prevents race conditions and double spending.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public User spendCoins(Long userId, long amount, String description, String refId) {
        if (amount <= 0) {
            throw new BadRequestException("Spend amount must be greater than zero");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getCoinsBalance() < amount) {
            throw new InsufficientCoinsException(
                    String.format("Insufficient coins. Required: %d, Available: %d", amount, user.getCoinsBalance())
            );
        }

        long newBalance = user.getCoinsBalance() - amount;
        user.setCoinsBalance(newBalance);
        user.setTotalCoinsSpent(user.getTotalCoinsSpent() + amount);
        user.updateVipLevel();
        user = userRepository.save(user);

        WalletTransaction tx = WalletTransaction.builder()
                .user(user)
                .amount(-amount)
                .balanceAfter(newBalance)
                .type(WalletTransaction.TransactionType.GIFT_SENT)
                .referenceId(refId != null ? refId : "SPEND-" + UUID.randomUUID().toString().substring(0, 8))
                .description(description)
                .createdAt(Instant.now())
                .build();
        walletTransactionRepository.save(tx);

        log.info("User {} spent {} coins. Balance: {}, VIP: {}", userId, amount, newBalance, user.getVipLevel());
        return user;
    }

    /**
     * Receive coins / gift earnings.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public User creditCoins(Long userId, long amount, String description, String refId) {
        if (amount <= 0) {
            throw new BadRequestException("Credit amount must be greater than zero");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        long newBalance = user.getCoinsBalance() + amount;
        user.setCoinsBalance(newBalance);
        user = userRepository.save(user);

        WalletTransaction tx = WalletTransaction.builder()
                .user(user)
                .amount(amount)
                .balanceAfter(newBalance)
                .type(WalletTransaction.TransactionType.GIFT_RECEIVED)
                .referenceId(refId != null ? refId : "CREDIT-" + UUID.randomUUID().toString().substring(0, 8))
                .description(description)
                .createdAt(Instant.now())
                .build();
        walletTransactionRepository.save(tx);

        return user;
    }

    public WalletTransactionDto toTxDto(WalletTransaction tx) {
        return WalletTransactionDto.builder()
                .id(tx.getId())
                .amount(tx.getAmount())
                .balanceAfter(tx.getBalanceAfter())
                .type(tx.getType().name())
                .referenceId(tx.getReferenceId())
                .description(tx.getDescription())
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
