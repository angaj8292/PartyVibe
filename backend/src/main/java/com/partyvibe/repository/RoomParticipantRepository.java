package com.partyvibe.repository;

import com.partyvibe.model.RoomParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomParticipantRepository extends JpaRepository<RoomParticipant, Long> {

    Optional<RoomParticipant> findByRoomIdAndUserIdAndLeftAtIsNull(Long roomId, Long userId);

    long countByRoomIdAndLeftAtIsNull(Long roomId);

    @Query("SELECT rp FROM RoomParticipant rp WHERE rp.room.id = :roomId AND rp.leftAt IS NULL ORDER BY rp.joinedAt ASC")
    List<RoomParticipant> findActiveByRoomId(@Param("roomId") Long roomId);

    List<RoomParticipant> findByUserIdAndLeftAtIsNull(Long userId);
}
