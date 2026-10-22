package com.partyvibe.repository;

import com.partyvibe.model.Room;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    List<Room> findByActiveTrueOrderByCreatedAtDesc(Pageable pageable);

    List<Room> findByActiveTrueAndCategoryIgnoreCaseOrderByCreatedAtDesc(String category, Pageable pageable);

    @Query("SELECT r FROM Room r WHERE r.active = true AND " +
           "(r.owner.id IN :followedUserIds OR EXISTS (" +
           "  SELECT rp FROM RoomParticipant rp WHERE rp.room.id = r.id AND rp.leftAt IS NULL AND rp.user.id IN :followedUserIds" +
           ")) ORDER BY r.createdAt DESC")
    List<Room> findRoomsWithFollowedUsers(@Param("followedUserIds") List<Long> followedUserIds, Pageable pageable);

    List<Room> findByOwnerIdAndActiveTrue(Long ownerId);
}
