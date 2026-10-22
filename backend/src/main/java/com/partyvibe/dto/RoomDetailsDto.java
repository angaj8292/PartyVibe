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
public class RoomDetailsDto {
    private RoomDto room;
    private List<RoomSeatDto> seats;
    private List<UserSummaryDto> viewers;
    private long viewerCount;
    private boolean isOwner;
    private boolean isBanned;
    private Integer currentSeatNo; // If the requesting user is on a seat
    private boolean isMutedOnSeat;
    private MusicStateDto musicState;
}
