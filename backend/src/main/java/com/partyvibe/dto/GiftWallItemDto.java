package com.partyvibe.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GiftWallItemDto {
    private Long giftId;
    private String giftName;
    private String icon;
    private long count;
    private long totalCoins;
}
