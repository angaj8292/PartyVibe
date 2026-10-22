package com.partyvibe;

import com.partyvibe.dto.CreateRoomRequest;
import com.partyvibe.model.Gift;
import com.partyvibe.model.User;
import com.partyvibe.repository.GiftRepository;
import com.partyvibe.repository.UserRepository;
import com.partyvibe.service.RoomService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Slf4j
@SpringBootApplication
public class PartyVibeApplication {

    public static void main(String[] args) {
        SpringApplication.run(PartyVibeApplication.class, args);
    }

    @Bean
    public CommandLineRunner initDatabase(
            GiftRepository giftRepository,
            UserRepository userRepository,
            RoomService roomService,
            PasswordEncoder passwordEncoder) {
        return args -> {
            // 1. Seed Gift Catalog if empty
            if (giftRepository.count() == 0) {
                log.info("Seeding PartyVibe virtual gift catalog...");
                List<Gift> defaultGifts = List.of(
                        Gift.builder().name("Rose").icon("🌹").coinPrice(10).animationType("FLOAT").soundEffect("rose_chime").build(),
                        Gift.builder().name("Bubble Tea").icon("🧋").coinPrice(50).animationType("FLOAT").soundEffect("pop").build(),
                        Gift.builder().name("Love Heart").icon("💖").coinPrice(100).animationType("SPARKLE").soundEffect("heartbeat").build(),
                        Gift.builder().name("Acoustic Guitar").icon("🎸").coinPrice(300).animationType("SPARKLE").soundEffect("guitar_riff").build(),
                        Gift.builder().name("Birthday Cake").icon("🎂").coinPrice(500).animationType("FIREWORKS").soundEffect("celebrate").build(),
                        Gift.builder().name("Sports Car").icon("🏎️").coinPrice(1000).animationType("CAR").soundEffect("engine_rev").build(),
                        Gift.builder().name("Luxury Yacht").icon("🛥️").coinPrice(3000).animationType("CAR").soundEffect("foghorn").build(),
                        Gift.builder().name("Golden Crown").icon("👑").coinPrice(5000).animationType("CROWN").soundEffect("fanfare").build(),
                        Gift.builder().name("Space Rocket").icon("🚀").coinPrice(10000).animationType("ROCKET").soundEffect("rocket_blast").build()
                );
                giftRepository.saveAll(defaultGifts);
                log.info("Seeded {} gifts successfully", defaultGifts.size());
            }

            // 2. Seed Default Demo Users if empty
            if (userRepository.count() == 0) {
                log.info("Seeding default demo users (alice, bob, charlie, david)...");
                String encPass = passwordEncoder.encode("password123");

                User alice = User.builder()
                        .username("alice")
                        .email("alice@partyvibe.app")
                        .passwordHash(encPass)
                        .avatarUrl("https://api.dicebear.com/7.x/bottts/svg?seed=alice")
                        .bio("Host & Singer 🎤 Welcome to my vibes!")
                        .age(23)
                        .gender("Female")
                        .coinsBalance(5000L)
                        .totalCoinsSpent(1200L)
                        .build();
                alice.updateVipLevel();
                alice = userRepository.save(alice);

                User bob = User.builder()
                        .username("bob")
                        .email("bob@partyvibe.app")
                        .passwordHash(encPass)
                        .avatarUrl("https://api.dicebear.com/7.x/bottts/svg?seed=bob")
                        .bio("Music lover & DJ 🎧 Let's chat!")
                        .age(25)
                        .gender("Male")
                        .coinsBalance(2500L)
                        .totalCoinsSpent(450L)
                        .build();
                bob.updateVipLevel();
                bob = userRepository.save(bob);

                User charlie = User.builder()
                        .username("charlie")
                        .email("charlie@partyvibe.app")
                        .passwordHash(encPass)
                        .avatarUrl("https://api.dicebear.com/7.x/bottts/svg?seed=charlie")
                        .bio("Gamer and late night chatter 🎮")
                        .age(22)
                        .gender("Male")
                        .coinsBalance(1500L)
                        .totalCoinsSpent(200L)
                        .build();
                charlie.updateVipLevel();
                charlie = userRepository.save(charlie);

                User david = User.builder()
                        .username("david")
                        .email("david@partyvibe.app")
                        .passwordHash(encPass)
                        .avatarUrl("https://api.dicebear.com/7.x/bottts/svg?seed=david")
                        .bio("Guitarist & Chill storyteller 🎸")
                        .age(26)
                        .gender("Male")
                        .coinsBalance(3000L)
                        .totalCoinsSpent(5500L)
                        .build();
                david.updateVipLevel();
                david = userRepository.save(david);

                // Create initial demo party rooms
                roomService.createRoom(alice.getId(), CreateRoomRequest.builder()
                        .title("🌟 Alice's Late Night Chill & Sing Lounge")
                        .category("Karaoke")
                        .isPublic(true)
                        .coverUrl("https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80")
                        .build());

                roomService.createRoom(bob.getId(), CreateRoomRequest.builder()
                        .title("🎧 EDM & Hip-Hop Beats Party")
                        .category("Music")
                        .isPublic(true)
                        .coverUrl("https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80")
                        .build());

                roomService.createRoom(david.getId(), CreateRoomRequest.builder()
                        .title("☕ Coffee & Casual Stories")
                        .category("Chat")
                        .isPublic(true)
                        .coverUrl("https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80")
                        .build());

                log.info("Demo users and initial rooms created successfully!");
            }
        };
    }
}
