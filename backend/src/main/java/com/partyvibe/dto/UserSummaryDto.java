package com.partyvibe.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryDto {
    private Long id;
    private String username;
    private String avatarUrl;
    private int vipLevel;

    @JsonProperty("isFollowing")
    private boolean isFollowing;

    @JsonProperty("isFriend")
    private boolean isFriend;
}
