package com.partyvibe.service;

import io.livekit.server.AccessToken;
import io.livekit.server.CanPublish;
import io.livekit.server.CanSubscribe;
import io.livekit.server.RoomJoin;
import io.livekit.server.RoomName;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class LiveKitService {

    @Value("${app.livekit.url:ws://localhost:7880}")
    private String livekitUrl;

    @Value("${app.livekit.api-key:devkey}")
    private String apiKey;

    @Value("${app.livekit.api-secret:secret}")
    private String apiSecret;

    public String getLivekitUrl() {
        return livekitUrl;
    }

    /**
     * Generates a LiveKit Access Token using livekit-server-sdk-java.
     * Publish permission only for users who hold a seat.
     * Listeners only receive subscribe permissions.
     */
    public String createToken(String roomName, String identity, String displayName, boolean canPublish) {
        log.info("Generating LiveKit SDK token: room={}, identity={}, displayName={}, canPublish={}",
                roomName, identity, displayName, canPublish);

        AccessToken token = new AccessToken(apiKey, apiSecret);
        token.setName(displayName);
        token.setIdentity(identity);
        token.setTtl(6 * 3600); // 6 hours

        token.addGrants(
                new RoomJoin(true),
                new RoomName(roomName),
                new CanPublish(canPublish),
                new CanSubscribe(true)
        );

        return token.toJwt();
    }
}
