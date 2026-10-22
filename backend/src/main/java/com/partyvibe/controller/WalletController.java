package com.partyvibe.controller;

import com.partyvibe.config.UserPrincipal;
import com.partyvibe.dto.TopUpRequest;
import com.partyvibe.dto.WalletDto;
import com.partyvibe.service.WalletService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
@Tag(name = "Wallet", description = "Coins wallet and top-up transactions")
public class WalletController {

    private final WalletService walletService;

    @GetMapping
    @Operation(summary = "Get user wallet balance and recent transactions")
    public ResponseEntity<WalletDto> getWallet(@AuthenticationPrincipal UserPrincipal principal) {
        WalletDto wallet = walletService.getWallet(principal.getId());
        return ResponseEntity.ok(wallet);
    }

    @PostMapping("/test-topup")
    @Operation(summary = "Top-up test coins into wallet")
    public ResponseEntity<WalletDto> testTopUp(
            @Valid @RequestBody TopUpRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        WalletDto updated = walletService.topUp(principal.getId(), req);
        return ResponseEntity.ok(updated);
    }
}
