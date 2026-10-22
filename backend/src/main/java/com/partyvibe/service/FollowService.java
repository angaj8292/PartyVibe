package com.partyvibe.service;

import com.partyvibe.dto.UserSummaryDto;
import com.partyvibe.exception.BadRequestException;
import com.partyvibe.exception.ResourceNotFoundException;
import com.partyvibe.model.Follow;
import com.partyvibe.model.User;
import com.partyvibe.repository.FollowRepository;
import com.partyvibe.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Transactional
    public boolean toggleFollow(Long followerId, Long followeeId) {
        if (followerId.equals(followeeId)) {
            throw new BadRequestException("You cannot follow yourself");
        }

        User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new ResourceNotFoundException("Follower not found"));
        User followee = userRepository.findById(followeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Target user not found"));

        boolean alreadyFollowing = followRepository.existsByFollowerIdAndFolloweeId(followerId, followeeId);

        if (alreadyFollowing) {
            followRepository.deleteByFollowerIdAndFolloweeId(followerId, followeeId);
            log.info("User {} unfollowed {}", followerId, followeeId);
            return false;
        } else {
            Follow follow = Follow.builder()
                    .follower(follower)
                    .followee(followee)
                    .build();
            followRepository.save(follow);
            log.info("User {} followed {}", followerId, followeeId);
            return true;
        }
    }

    @Transactional(readOnly = true)
    public List<UserSummaryDto> getFollowers(Long userId, Long currentUserId, int page, int size) {
        return followRepository.findFollowersByUserId(userId, PageRequest.of(page, size))
                .stream()
                .map(u -> userMapper.toSummaryDto(u, currentUserId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserSummaryDto> getFollowing(Long userId, Long currentUserId, int page, int size) {
        return followRepository.findFollowingByUserId(userId, PageRequest.of(page, size))
                .stream()
                .map(u -> userMapper.toSummaryDto(u, currentUserId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserSummaryDto> getFriends(Long userId, Long currentUserId, int page, int size) {
        return followRepository.findFriendsByUserId(userId, PageRequest.of(page, size))
                .stream()
                .map(u -> userMapper.toSummaryDto(u, currentUserId))
                .collect(Collectors.toList());
    }
}
