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
public class MusicStateDto {
    private Long roomId;
    private String musicTitle;
    private String musicUrl;
    private boolean musicPlaying;
    private Long positionMs;
    @Builder.Default
    private Instant timestamp = Instant.now();
}
