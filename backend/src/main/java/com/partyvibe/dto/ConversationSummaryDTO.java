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
public class ConversationSummaryDTO {
    private Long partnerId;
    private String partnerUsername;
    private String partnerAvatarUrl;
    private int partnerVipLevel;
    private String partnerBio;
    private String lastMessageContent;
    private Instant lastMessageTime;
    private long unreadCount;
    private boolean isLastMessageFromMe;
}
