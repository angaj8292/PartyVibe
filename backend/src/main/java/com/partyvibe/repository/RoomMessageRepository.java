package com.partyvibe.repository;

import com.partyvibe.model.RoomMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomMessageRepository extends JpaRepository<RoomMessage, Long> {

    @Query("SELECT m FROM RoomMessage m LEFT JOIN FETCH m.sender WHERE m.room.id = :roomId ORDER BY m.createdAt ASC")
    List<RoomMessage> findRecentMessagesByRoomId(@Param("roomId") Long roomId, Pageable pageable);
}
