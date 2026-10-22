package com.partyvibe.service;

import com.partyvibe.config.JwtUtil;
import com.partyvibe.dto.AuthRequest;
import com.partyvibe.dto.AuthResponse;
import com.partyvibe.dto.RegisterRequest;
import com.partyvibe.dto.UserProfileDto;
import com.partyvibe.exception.BadRequestException;
import com.partyvibe.exception.ResourceNotFoundException;
import com.partyvibe.exception.UnauthorizedException;
import com.partyvibe.model.User;
import com.partyvibe.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final UserMapper userMapper;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String username = req.getUsername().trim().toLowerCase();
        String email = req.getEmail().trim().toLowerCase();

        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new BadRequestException("Username is already taken");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new BadRequestException("Email is already registered");
        }

        String defaultAvatar = "https://api.dicebear.com/7.x/bottts/svg?seed=" + username;
        String avatar = req.getAvatarUrl() != null && !req.getAvatarUrl().isBlank()
                ? req.getAvatarUrl()
                : defaultAvatar;

        User user = User.builder()
                .username(username)
                .email(email)
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .avatarUrl(avatar)
                .bio(req.getBio() != null ? req.getBio() : "Ready to vibe at PartyVibe! 🎤")
                .age(req.getAge() != null ? req.getAge() : 21)
                .gender(req.getGender() != null ? req.getGender() : "Secret")
                .birthday(req.getBirthday())
                .coinsBalance(100L) // Starting welcome coins
                .totalCoinsSpent(0L)
                .vipLevel(0)
                .postsCount(0)
                .build();

        user = userRepository.save(user);
        log.info("Registered new user: {} (ID: {})", user.getUsername(), user.getId());

        String token = jwtUtil.generateToken(user.getId(), user.getUsername());
        UserProfileDto profileDto = userMapper.toProfileDto(user, user.getId());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(profileDto)
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(AuthRequest req) {
        String identifier = req.getUsernameOrEmail().trim().toLowerCase();
        User user = userRepository.findByUsernameIgnoreCase(identifier)
                .or(() -> userRepository.findByEmailIgnoreCase(identifier))
                .orElseThrow(() -> new UnauthorizedException("Invalid username or password"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid username or password");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getUsername());
        UserProfileDto profileDto = userMapper.toProfileDto(user, user.getId());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(profileDto)
                .build();
    }

    @Transactional(readOnly = true)
    public UserProfileDto getCurrentUserProfile(Long currentUserId) {
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return userMapper.toProfileDto(user, currentUserId);
    }
}
