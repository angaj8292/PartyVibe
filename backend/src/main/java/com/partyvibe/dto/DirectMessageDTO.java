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
public class DirectMessageDTO {
    private Long id;
    private Long senderId;
    private String senderUsername;
    private String senderAvatarUrl;
    private int senderVipLevel;
    private Long receiverId;
    private String receiverUsername;
    private String receiverAvatarUrl;
    private int receiverVipLevel;
    private String content;
    private boolean isRead;
    private Instant createdAt;
}
