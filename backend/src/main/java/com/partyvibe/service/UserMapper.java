package com.partyvibe.service;

import com.partyvibe.dto.UserProfileDto;
import com.partyvibe.dto.UserSummaryDto;
import com.partyvibe.model.User;
import com.partyvibe.repository.BlockRepository;
import com.partyvibe.repository.FollowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserMapper {

    private final FollowRepository followRepository;
    private final BlockRepository blockRepository;

    public UserSummaryDto toSummaryDto(User user, Long currentUserId) {
        if (user == null) return null;

        boolean isFollowing = false;
        boolean isFriend = false;

        if (currentUserId != null && !currentUserId.equals(user.getId())) {
            isFollowing = followRepository.existsByFollowerIdAndFolloweeId(currentUserId, user.getId());
            boolean followedBack = followRepository.existsByFollowerIdAndFolloweeId(user.getId(), currentUserId);
            isFriend = isFollowing && followedBack;
        }

        return UserSummaryDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .avatarUrl(user.getAvatarUrl())
                .vipLevel(user.getVipLevel())
                .isFollowing(isFollowing)
                .isFriend(isFriend)
                .build();
    }

    public UserProfileDto toProfileDto(User user, Long currentUserId) {
        if (user == null) return null;

        long followersCount = followRepository.countByFolloweeId(user.getId());
        long followingCount = followRepository.countByFollowerId(user.getId());
        long friendsCount = followRepository.countFriends(user.getId());

        boolean isFollowing = false;
        boolean isFriend = false;
        boolean isBlocked = false;

        if (currentUserId != null && !currentUserId.equals(user.getId())) {
            isFollowing = followRepository.existsByFollowerIdAndFolloweeId(currentUserId, user.getId());
            boolean followedBack = followRepository.existsByFollowerIdAndFolloweeId(user.getId(), currentUserId);
            isFriend = isFollowing && followedBack;
            isBlocked = blockRepository.existsByBlockerIdAndBlockedId(currentUserId, user.getId());
        }

        return UserProfileDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .age(user.getAge())
                .gender(user.getGender())
                .birthday(user.getBirthday())
                .vipLevel(user.getVipLevel())
                .coinsBalance(user.getCoinsBalance())
                .totalCoinsSpent(user.getTotalCoinsSpent())
                .postsCount(user.getPostsCount())
                .followersCount(followersCount)
                .followingCount(followingCount)
                .friendsCount(friendsCount)
                .isFollowing(isFollowing)
                .isFriend(isFriend)
                .isBlocked(isBlocked)
                .createdAt(user.getCreatedAt())
                .build();
    }
}
