package com.partyvibe.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LiveKitTokenResponse {
    private String token;
    private String livekitUrl;
    private String roomName;
    private String identity;
    private boolean canPublish;
    private boolean canSubscribe;
}
