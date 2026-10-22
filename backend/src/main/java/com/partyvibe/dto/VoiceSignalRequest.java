package com.partyvibe.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoiceSignalRequest {
    private String action; // "JOIN", "OFFER", "ANSWER", "ICE", "MUTE", "LEAVE", "SPEAKING", "REQUEST_OFFER"
    private Long senderId;
    private String senderUsername;
    private Long targetUserId; // null for broadcast to all in room
    private Object sdp; // Session Description (offer or answer)
    private Object candidate; // ICE Candidate object
    private Boolean isMuted;
    private Boolean isSpeaker;
    private Integer seatNo;
}
