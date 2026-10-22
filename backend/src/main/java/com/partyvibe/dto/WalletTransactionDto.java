package com.partyvibe.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletTransactionDto {
    private Long id;
    private long amount;
    private long balanceAfter;
    private String type;
    private String referenceId;
    private String description;
    private Instant createdAt;
}
