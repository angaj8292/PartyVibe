package com.partyvibe.repository;

import com.partyvibe.model.Block;
import com.partyvibe.model.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlockRepository extends JpaRepository<Block, Long> {

    boolean existsByBlockerIdAndBlockedId(Long blockerId, Long blockedId);

    Optional<Block> findByBlockerIdAndBlockedId(Long blockerId, Long blockedId);

    void deleteByBlockerIdAndBlockedId(Long blockerId, Long blockedId);

    @Query("SELECT b.blocked FROM Block b WHERE b.blocker.id = :userId ORDER BY b.createdAt DESC")
    List<User> findBlockedUsersByBlockerId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT COUNT(b) > 0 FROM Block b WHERE " +
           "(b.blocker.id = :user1Id AND b.blocked.id = :user2Id) OR " +
           "(b.blocker.id = :user2Id AND b.blocked.id = :user1Id)")
    boolean isBlockedEitherWay(@Param("user1Id") Long user1Id, @Param("user2Id") Long user2Id);
}
