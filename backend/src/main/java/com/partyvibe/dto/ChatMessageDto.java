package com.partyvibe.dto;

import com.partyvibe.model.RoomMessage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDto {
    private Long id;
    private Long roomId;
    private UserSummaryDto sender;
    private String content;
    private RoomMessage.MessageType type;
    private Instant createdAt;
}
