package com.partyvibe.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportRequest {
    private Long reportedUserId;
    private Long reportedRoomId;

    @NotBlank(message = "Reason is required")
    private String reason; // SPAM, HARASSMENT, INAPPROPRIATE_CONTENT, OTHER

    private String description;
}
