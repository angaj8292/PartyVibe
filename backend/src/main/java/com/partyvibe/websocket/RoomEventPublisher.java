package com.partyvibe.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoomEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WebSocketEvent<T> {
        private String eventType;
        private Long roomId;
        private T payload;
        @Builder.Default
        private Instant timestamp = Instant.now();
    }

    public void broadcastToRoom(Long roomId, String eventType, Object payload) {
        String destination = "/topic/room." + roomId;
        WebSocketEvent<Object> event = WebSocketEvent.builder()
                .eventType(eventType)
                .roomId(roomId)
                .payload(payload)
                .build();
        log.debug("Broadcasting to {}: eventType={}", destination, eventType);
        messagingTemplate.convertAndSend(destination, event);
    }

    public void broadcastPresence(Object payload) {
        messagingTemplate.convertAndSend("/topic/presence", payload);
    }

    public void sendToUser(String username, String eventType, Object payload) {
        WebSocketEvent<Object> event = WebSocketEvent.builder()
                .eventType(eventType)
                .payload(payload)
                .build();
        messagingTemplate.convertAndSendToUser(username, "/queue/notifications", event);
    }
}
