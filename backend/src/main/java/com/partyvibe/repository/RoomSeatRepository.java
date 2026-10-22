package com.partyvibe.repository;

import com.partyvibe.model.RoomSeat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomSeatRepository extends JpaRepository<RoomSeat, Long> {

    List<RoomSeat> findByRoomIdOrderBySeatNoAsc(Long roomId);

    Optional<RoomSeat> findByRoomIdAndSeatNo(Long roomId, int seatNo);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM RoomSeat s WHERE s.room.id = :roomId AND s.seatNo = :seatNo")
    Optional<RoomSeat> findByRoomIdAndSeatNoForUpdate(@Param("roomId") Long roomId, @Param("seatNo") int seatNo);

    Optional<RoomSeat> findByRoomIdAndUserId(Long roomId, Long userId);

    List<RoomSeat> findByUserId(Long userId);

    long countByRoomIdAndUserIsNotNull(Long roomId);

    long countByRoomIdAndLockedTrue(Long roomId);
}
