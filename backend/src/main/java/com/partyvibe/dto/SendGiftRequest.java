package com.partyvibe.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendGiftRequest {

    @NotNull(message = "Gift ID is required")
    private Long giftId;

    @NotNull(message = "Receiver ID is required")
    private Long receiverId;

    private Long roomId; // Optional if sent in a room
}
