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
public class MusicActionRequest {

    public enum MusicAction {
        PLAY,
        PAUSE,
        CHANGE,
        STOP
    }

    @NotNull(message = "Action is required")
    private MusicAction action;

    private String musicTitle;
    private String musicUrl;
    private Long positionMs;
}
