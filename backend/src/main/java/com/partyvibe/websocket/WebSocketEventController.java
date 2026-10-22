package com.partyvibe.websocket;

import com.partyvibe.config.UserPrincipal;
import com.partyvibe.dto.SeatActionRequest;
import com.partyvibe.dto.SendChatRequest;
import com.partyvibe.service.ChatService;
import com.partyvibe.service.SeatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Slf4j
@Controller
@RequiredArgsConstructor
public class WebSocketEventController {

    private final ChatService chatService;
    private final SeatService seatService;

    @MessageMapping("/room/{roomId}/chat")
    public void handleChatMessage(
            @DestinationVariable Long roomId,
            @Payload SendChatRequest req,
            Principal principal) {
        if (principal instanceof Authentication auth && auth.getPrincipal() instanceof UserPrincipal userPrincipal) {
            log.debug("STOMP chat from {}: {}", userPrincipal.getUsername(), req.getContent());
            chatService.sendMessage(userPrincipal.getId(), roomId, req);
        } else {
            log.warn("Unauthenticated STOMP chat message rejected");
        }
    }

    @MessageMapping("/room/{roomId}/seat")
    public void handleSeatAction(
            @DestinationVariable Long roomId,
            @Payload SeatActionRequest req,
            Principal principal) {
        if (principal instanceof Authentication auth && auth.getPrincipal() instanceof UserPrincipal userPrincipal) {
            log.debug("STOMP seat action from {}: seat={}, action={}",
                    userPrincipal.getUsername(), req.getSeatNo(), req.getAction());
            seatService.performSeatAction(userPrincipal.getId(), roomId, req);
        } else {
            log.warn("Unauthenticated STOMP seat action rejected");
        }
    }
}
