package com.partyvibe.controller;

import com.partyvibe.config.UserPrincipal;
import com.partyvibe.dto.GiftDto;
import com.partyvibe.dto.GiftEventDto;
import com.partyvibe.dto.SendGiftRequest;
import com.partyvibe.service.GiftService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gifts")
@RequiredArgsConstructor
@Tag(name = "Gifts", description = "Virtual gift catalog and gifting system")
public class GiftController {

    private final GiftService giftService;

    @GetMapping
    @Operation(summary = "Get the virtual gift catalog")
    public ResponseEntity<List<GiftDto>> getGifts() {
        List<GiftDto> gifts = giftService.getGifts();
        return ResponseEntity.ok(gifts);
    }

    @GetMapping("/records")
    @Operation(summary = "Get special and standard gift records (sent and received)")
    public ResponseEntity<List<GiftEventDto>> getGiftRecords(
            @RequestParam(defaultValue = "all") String type,
            @RequestParam(defaultValue = "30") int limit,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<GiftEventDto> records = giftService.getUserGiftRecords(principal.getId(), type, limit);
        return ResponseEntity.ok(records);
    }

    @PostMapping("/send")
    @Operation(summary = "Send a virtual gift to a user")
    public ResponseEntity<GiftEventDto> sendGift(
            @Valid @RequestBody SendGiftRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        GiftEventDto event = giftService.sendGift(principal.getId(), req);
        return ResponseEntity.ok(event);
    }
}
