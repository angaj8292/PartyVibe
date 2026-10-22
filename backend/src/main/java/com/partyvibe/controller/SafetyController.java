package com.partyvibe.controller;

import com.partyvibe.config.UserPrincipal;
import com.partyvibe.dto.BlockRequest;
import com.partyvibe.dto.ReportRequest;
import com.partyvibe.dto.UserSummaryDto;
import com.partyvibe.model.Report;
import com.partyvibe.service.SafetyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Safety", description = "Reports, user blocking, and safety controls")
public class SafetyController {

    private final SafetyService safetyService;

    @PostMapping("/reports")
    @Operation(summary = "Submit a report against a user or room")
    public ResponseEntity<Map<String, Object>> submitReport(
            @Valid @RequestBody ReportRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        Report report = safetyService.createReport(principal.getId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "status", "reported",
                "reportId", report.getId()
        ));
    }

    @PostMapping("/users/{id}/block")
    @Operation(summary = "Block a user")
    public ResponseEntity<Map<String, Boolean>> blockUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        boolean blocked = safetyService.blockUser(principal.getId(), id);
        return ResponseEntity.ok(Collections.singletonMap("blocked", blocked));
    }

    @DeleteMapping("/users/{id}/block")
    @Operation(summary = "Unblock a user")
    public ResponseEntity<Map<String, Boolean>> unblockUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        boolean unblocked = safetyService.unblockUser(principal.getId(), id);
        return ResponseEntity.ok(Collections.singletonMap("unblocked", unblocked));
    }

    @GetMapping("/users/blocked")
    @Operation(summary = "Get list of blocked users")
    public ResponseEntity<List<UserSummaryDto>> getBlockedUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<UserSummaryDto> blocked = safetyService.getBlockedUsers(principal.getId(), page, size);
        return ResponseEntity.ok(blocked);
    }
}
