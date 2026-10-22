package com.partyvibe.repository;

import com.partyvibe.model.DirectMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface DirectMessageRepository extends JpaRepository<DirectMessage, Long> {

    @Query("SELECT m FROM DirectMessage m WHERE " +
           "(m.sender.id = :user1Id AND m.receiver.id = :user2Id) OR " +
           "(m.sender.id = :user2Id AND m.receiver.id = :user1Id) " +
           "ORDER BY m.createdAt ASC")
    List<DirectMessage> findConversationHistory(
            @Param("user1Id") Long user1Id,
            @Param("user2Id") Long user2Id
    );

    @Query("SELECT DISTINCT CASE WHEN m.sender.id = :userId THEN m.receiver.id ELSE m.sender.id END " +
           "FROM DirectMessage m WHERE m.sender.id = :userId OR m.receiver.id = :userId")
    List<Long> findDistinctPartnerIds(@Param("userId") Long userId);

    @Query("SELECT m FROM DirectMessage m WHERE " +
           "(m.sender.id = :user1Id AND m.receiver.id = :user2Id) OR " +
           "(m.sender.id = :user2Id AND m.receiver.id = :user1Id) " +
           "ORDER BY m.createdAt DESC")
    List<DirectMessage> findLatestMessage(
            @Param("user1Id") Long user1Id,
            @Param("user2Id") Long user2Id,
            Pageable pageable
    );

    @Query("SELECT COUNT(m) FROM DirectMessage m WHERE m.receiver.id = :receiverId AND m.sender.id = :senderId AND m.isRead = false")
    long countUnreadFromPartner(@Param("receiverId") Long receiverId, @Param("senderId") Long senderId);

    @Query("SELECT COUNT(m) FROM DirectMessage m WHERE m.receiver.id = :receiverId AND m.isRead = false")
    long countTotalUnread(@Param("receiverId") Long receiverId);

    @Modifying
    @Transactional
    @Query("UPDATE DirectMessage m SET m.isRead = true WHERE m.receiver.id = :receiverId AND m.sender.id = :senderId AND m.isRead = false")
    int markConversationAsRead(@Param("receiverId") Long receiverId, @Param("senderId") Long senderId);
}
