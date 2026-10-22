package com.partyvibe.service;

import com.partyvibe.dto.UpdateProfileRequest;
import com.partyvibe.dto.UserProfileDto;
import com.partyvibe.dto.UserSummaryDto;
import com.partyvibe.exception.ResourceNotFoundException;
import com.partyvibe.model.User;
import com.partyvibe.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Transactional(readOnly = true)
    public UserProfileDto getUserById(Long userId, Long currentUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        return userMapper.toProfileDto(user, currentUserId);
    }

    @Transactional(readOnly = true)
    public UserProfileDto getUserByUsername(String username, Long currentUserId) {
        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return userMapper.toProfileDto(user, currentUserId);
    }

    @Transactional
    public UserProfileDto updateProfile(Long userId, UpdateProfileRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (req.getAvatarUrl() != null && !req.getAvatarUrl().isBlank()) {
            user.setAvatarUrl(req.getAvatarUrl());
        }
        if (req.getBio() != null) {
            user.setBio(req.getBio());
        }
        if (req.getAge() != null) {
            user.setAge(req.getAge());
        }
        if (req.getGender() != null) {
            user.setGender(req.getGender());
        }
        if (req.getBirthday() != null) {
            user.setBirthday(req.getBirthday());
        }

        user = userRepository.save(user);
        return userMapper.toProfileDto(user, userId);
    }

    @Transactional
    public UserProfileDto uploadAvatar(Long userId, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file cannot be empty");
        }

        try {
            Path uploadDir = Paths.get("uploads", "avatars").toAbsolutePath().normalize();
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            String originalFilename = file.getOriginalFilename();
            String extension = ".jpg";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String filename = "avatar_" + userId + "_" + System.currentTimeMillis() + extension;
            Path targetPath = uploadDir.resolve(filename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String avatarUrl = "/uploads/avatars/" + filename;
            user.setAvatarUrl(avatarUrl);
            user = userRepository.save(user);

            log.info("Saved avatar for user {} at {}", user.getUsername(), avatarUrl);
            return userMapper.toProfileDto(user, userId);
        } catch (IOException e) {
            log.error("Failed to store avatar file for user " + userId, e);
            throw new RuntimeException("Failed to save avatar image: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<UserSummaryDto> searchUsers(String query, Long currentUserId, int limit) {
        if (query == null || query.trim().isBlank()) {
            return List.of();
        }
        return userRepository.searchUsers(query.trim(), PageRequest.of(0, limit))
                .stream()
                .map(u -> userMapper.toSummaryDto(u, currentUserId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserSummaryDto> getRecommendedUsers(Long currentUserId, int limit) {
        return userRepository.findRecommendedUsers(currentUserId, PageRequest.of(0, limit))
                .stream()
                .map(u -> userMapper.toSummaryDto(u, currentUserId))
                .collect(Collectors.toList());
    }
}
