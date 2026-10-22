package com.partyvibe.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_username", columnList = "username"),
    @Index(name = "idx_users_email", columnList = "email")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @JsonIgnore
    @Column(nullable = false)
    private String passwordHash;

    @Column(columnDefinition = "TEXT")
    private String avatarUrl;

    @Column(length = 255)
    @Builder.Default
    private String bio = "Hey there! Ready to party with PartyVibe 🎤";

    private Integer age;

    @Column(length = 20)
    private String gender; // Male, Female, Other, Secret

    private LocalDate birthday;

    @Builder.Default
    private int vipLevel = 0;

    @Builder.Default
    private long coinsBalance = 0L;

    @Builder.Default
    private long totalCoinsSpent = 0L;

    @Builder.Default
    private int postsCount = 0;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;

    public void updateVipLevel() {
        if (totalCoinsSpent >= 100000) {
            vipLevel = 8;
        } else if (totalCoinsSpent >= 50000) {
            vipLevel = 7;
        } else if (totalCoinsSpent >= 25000) {
            vipLevel = 6;
        } else if (totalCoinsSpent >= 10000) {
            vipLevel = 5;
        } else if (totalCoinsSpent >= 5000) {
            vipLevel = 4;
        } else if (totalCoinsSpent >= 2000) {
            vipLevel = 3;
        } else if (totalCoinsSpent >= 500) {
            vipLevel = 2;
        } else if (totalCoinsSpent >= 100) {
            vipLevel = 1;
        } else {
            vipLevel = 0;
        }
    }
}
