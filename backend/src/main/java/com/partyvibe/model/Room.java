package com.partyvibe.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rooms", indexes = {
    @Index(name = "idx_rooms_active", columnList = "active"),
    @Index(name = "idx_rooms_category", columnList = "category"),
    @Index(name = "idx_rooms_owner", columnList = "owner_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String category = "Party"; // Chat, Music, Gaming, Karaoke, Party, Chill

    @Column(nullable = false)
    @Builder.Default
    private boolean isPublic = true;

    @Column(length = 100)
    private String password;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(length = 255)
    private String coverUrl;

    // Room Background Music fields
    @Column(length = 150)
    private String currentMusicTitle;

    @Column(length = 500)
    private String currentMusicUrl;

    @Builder.Default
    private boolean musicPlaying = false;

    private Long musicPositionMs;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("seatNo ASC")
    @Builder.Default
    private List<RoomSeat> seats = new ArrayList<>();
}
