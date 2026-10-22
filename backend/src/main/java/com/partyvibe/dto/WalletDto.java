package com.partyvibe.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletDto {
    private long coinsBalance;
    private long totalCoinsSpent;
    private int vipLevel;
    private List<WalletTransactionDto> recentTransactions;
}
