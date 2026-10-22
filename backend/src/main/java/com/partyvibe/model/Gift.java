package com.partyvibe.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "gifts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Gift {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @Column(nullable = false, length = 255)
    private String icon; // emoji or icon URL

    @Column(nullable = false)
    private long coinPrice;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String animationType = "FLOAT"; // FLOAT, SPARKLE, FIREWORKS, CAR, CROWN, ROCKET

    @Column(length = 100)
    private String soundEffect;
}
