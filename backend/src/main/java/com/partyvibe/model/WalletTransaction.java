package com.partyvibe.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "wallet_transactions", indexes = {
    @Index(name = "idx_wallet_tx_user", columnList = "user_id, createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletTransaction {

    public enum TransactionType {
        TOPUP,
        GIFT_SENT,
        GIFT_RECEIVED,
        REFUND
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private long amount; // Positive for credit, negative for debit

    @Column(nullable = false)
    private long balanceAfter;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TransactionType type;

    @Column(length = 100)
    private String referenceId; // External payment ID or internal UUID

    @Column(length = 255)
    private String description;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;
}
