package com.partyvibe.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {
    private Long id;
    private String username;
    private String email;
    private String avatarUrl;
    private String bio;
    private Integer age;
    private String gender;
    private LocalDate birthday;
    private int vipLevel;
    private long coinsBalance;
    private long totalCoinsSpent;
    private int postsCount;
    private long followersCount;
    private long followingCount;
    private long friendsCount;

    @JsonProperty("isFollowing")
    private boolean isFollowing;

    @JsonProperty("isFriend")
    private boolean isFriend;

    @JsonProperty("isBlocked")
    private boolean isBlocked;

    private Instant createdAt;
}
