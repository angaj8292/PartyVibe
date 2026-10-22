package com.partyvibe.repository;

import com.partyvibe.model.RoomBan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomBanRepository extends JpaRepository<RoomBan, Long> {

    boolean existsByRoomIdAndUserId(Long roomId, Long userId);

    void deleteByRoomIdAndUserId(Long roomId, Long userId);

    List<RoomBan> findByRoomId(Long roomId);
}
