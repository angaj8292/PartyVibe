package com.partyvibe.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatActionRequest {

    public enum SeatAction {
        TAKE,
        LEAVE,
        LOCK,
        UNLOCK,
        MUTE,
        UNMUTE,
        KICK
    }

    @NotNull(message = "Seat number is required")
    @Min(value = 1, message = "Seat number must be between 1 and 8")
    @Max(value = 8, message = "Seat number must be between 1 and 8")
    private Integer seatNo;

    @NotNull(message = "Action is required")
    private SeatAction action;

    private Long targetUserId; // Used for KICK if specified
}
