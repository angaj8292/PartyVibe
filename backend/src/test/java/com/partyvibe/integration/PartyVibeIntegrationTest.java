package com.partyvibe.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.partyvibe.dto.AuthRequest;
import com.partyvibe.dto.CreateRoomRequest;
import com.partyvibe.dto.SendGiftRequest;
import com.partyvibe.dto.TopUpRequest;
import com.partyvibe.model.Gift;
import com.partyvibe.repository.GiftRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class PartyVibeIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private GiftRepository giftRepository;

    @Test
    @DisplayName("End-to-End: Login -> Create Room -> Topup Coins -> Send Gift -> Check Wall")
    void testEndToEndPartyFlow() throws Exception {
        // 1. Login as Alice (Host)
        AuthRequest aliceLogin = AuthRequest.builder()
                .usernameOrEmail("alice")
                .password("password123")
                .build();

        MvcResult aliceAuthResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(aliceLogin)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode aliceJson = objectMapper.readTree(aliceAuthResult.getResponse().getContentAsString());
        String aliceToken = aliceJson.get("token").asText();
        long aliceId = aliceJson.get("user").get("id").asLong();
        assertNotNull(aliceToken);

        // 2. Login as Bob (Guest)
        AuthRequest bobLogin = AuthRequest.builder()
                .usernameOrEmail("bob")
                .password("password123")
                .build();

        MvcResult bobAuthResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bobLogin)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode bobJson = objectMapper.readTree(bobAuthResult.getResponse().getContentAsString());
        String bobToken = bobJson.get("token").asText();
        long bobId = bobJson.get("user").get("id").asLong();
        long bobInitialBalance = bobJson.get("user").get("coinsBalance").asLong();
        assertNotNull(bobToken);

        // 3. Alice creates a room
        CreateRoomRequest roomReq = CreateRoomRequest.builder()
                .title("Integration Test Voice Party")
                .category("Party")
                .isPublic(true)
                .build();

        MvcResult roomResult = mockMvc.perform(post("/api/rooms")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(roomReq)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode roomJson = objectMapper.readTree(roomResult.getResponse().getContentAsString());
        long roomId = roomJson.get("id").asLong();
        assertTrue(roomId > 0);

        // 4. Bob joins Alice's room
        mockMvc.perform(post("/api/rooms/" + roomId + "/join")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk());

        // 5. Bob tops up 1000 test coins
        TopUpRequest topUpReq = TopUpRequest.builder().amount(1000L).build();
        mockMvc.perform(post("/api/wallet/test-topup")
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(topUpReq)))
                .andExpect(status().isOk());

        // 6. Find a gift (e.g. Rose)
        Gift rose = giftRepository.findAll().stream()
                .filter(g -> g.getName().equalsIgnoreCase("Rose"))
                .findFirst()
                .orElseThrow();

        // 7. Bob sends a Rose to Alice in the room
        SendGiftRequest giftReq = SendGiftRequest.builder()
                .giftId(rose.getId())
                .receiverId(aliceId)
                .roomId(roomId)
                .build();

        MvcResult giftResult = mockMvc.perform(post("/api/gifts/send")
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(giftReq)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode giftEventJson = objectMapper.readTree(giftResult.getResponse().getContentAsString());
        assertEquals("Rose", giftEventJson.get("gift").get("name").asText());
        assertEquals(rose.getCoinPrice(), giftEventJson.get("coins").asLong());

        // 8. Verify Alice's gift wall
        MvcResult wallResult = mockMvc.perform(get("/api/users/" + aliceId + "/gift-wall")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode wallJson = objectMapper.readTree(wallResult.getResponse().getContentAsString());
        assertTrue(wallJson.isArray());
        assertTrue(wallJson.size() > 0);
        assertEquals("Rose", wallJson.get(0).get("giftName").asText());

        // 9. Verify LiveKit token for Bob (subscriber since not seated) vs Alice (publisher on Seat 1)
        MvcResult bobLivekitResult = mockMvc.perform(get("/api/rooms/" + roomId + "/livekit-token")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode bobLkJson = objectMapper.readTree(bobLivekitResult.getResponse().getContentAsString());
        assertFalse(bobLkJson.get("canPublish").asBoolean()); // Listener only
        assertTrue(bobLkJson.get("canSubscribe").asBoolean());

        MvcResult aliceLivekitResult = mockMvc.perform(get("/api/rooms/" + roomId + "/livekit-token")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode aliceLkJson = objectMapper.readTree(aliceLivekitResult.getResponse().getContentAsString());
        assertTrue(aliceLkJson.get("canPublish").asBoolean()); // Seated on seat 1
    }
}
