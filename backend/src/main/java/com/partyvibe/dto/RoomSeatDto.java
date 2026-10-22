package com.partyvibe.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomSeatDto {
    private Long id;
    private int seatNo;
    private UserSummaryDto user;
    private boolean locked;
    private boolean muted;
}
