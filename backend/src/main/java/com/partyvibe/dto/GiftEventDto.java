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
public class GiftEventDto {
    private Long id;
    private UserSummaryDto sender;
    private UserSummaryDto receiver;
    private GiftDto gift;
    private Long roomId;
    private long coins;
    private Instant createdAt;
}
