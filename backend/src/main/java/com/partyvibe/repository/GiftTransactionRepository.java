package com.partyvibe.repository;

import com.partyvibe.model.GiftTransaction;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GiftTransactionRepository extends JpaRepository<GiftTransaction, Long> {

    @Query("SELECT gt.gift.id AS giftId, gt.gift.name AS giftName, gt.gift.icon AS icon, " +
           "COUNT(gt) AS giftCount, SUM(gt.coins) AS totalCoins " +
           "FROM GiftTransaction gt WHERE gt.receiver.id = :userId " +
           "GROUP BY gt.gift.id, gt.gift.name, gt.gift.icon " +
           "ORDER BY COUNT(gt) DESC")
    List<GiftWallItemProjection> findGiftWallByReceiverId(@Param("userId") Long userId);

    List<GiftTransaction> findByReceiverIdOrderByCreatedAtDesc(Long receiverId, Pageable pageable);

    List<GiftTransaction> findBySenderIdOrderByCreatedAtDesc(Long senderId, Pageable pageable);

    List<GiftTransaction> findByRoomIdOrderByCreatedAtDesc(Long roomId, Pageable pageable);

    interface GiftWallItemProjection {
        Long getGiftId();
        String getGiftName();
        String getIcon();
        Long getGiftCount();
        Long getTotalCoins();
    }
}
