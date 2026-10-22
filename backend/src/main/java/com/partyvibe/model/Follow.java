package com.partyvibe.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "follows", uniqueConstraints = {
    @UniqueConstraint(name = "uk_follows_follower_followee", columnNames = {"follower_id", "followee_id"})
}, indexes = {
    @Index(name = "idx_follows_follower", columnList = "follower_id"),
    @Index(name = "idx_follows_followee", columnList = "followee_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Follow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "follower_id", nullable = false)
    private User follower;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "followee_id", nullable = false)
    private User followee;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;
}
