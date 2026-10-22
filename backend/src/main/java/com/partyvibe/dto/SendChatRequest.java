package com.partyvibe.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendChatRequest {

    @NotBlank(message = "Message content cannot be blank")
    @Size(max = 500, message = "Message cannot exceed 500 characters")
    private String content;
}
