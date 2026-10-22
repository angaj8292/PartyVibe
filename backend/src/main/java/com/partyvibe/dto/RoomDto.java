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
public class RoomDto {
    private Long id;
    private String title;
    private String category;
    private boolean isPublic;
    private boolean hasPassword;
    private UserSummaryDto owner;
    private boolean active;
    private String coverUrl;
    private long listenerCount;
    private long occupiedSeatsCount;
    private int seatsLeft;
    private String currentMusicTitle;
    private String currentMusicUrl;
    private boolean musicPlaying;
    private Long musicPositionMs;
    private Instant createdAt;
}
