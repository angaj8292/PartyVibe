package com.partyvibe.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "room_seats", uniqueConstraints = {
    @UniqueConstraint(name = "uk_room_seat", columnNames = {"room_id", "seat_no"})
}, indexes = {
    @Index(name = "idx_seat_room_user", columnList = "room_id, user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomSeat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(name = "seat_no", nullable = false)
    private int seatNo; // 1 to 8

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user; // null if empty

    @Column(nullable = false)
    @Builder.Default
    private boolean locked = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean muted = false;
}
