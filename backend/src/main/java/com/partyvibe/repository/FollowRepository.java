package com.partyvibe.repository;

import com.partyvibe.model.Follow;
import com.partyvibe.model.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FollowRepository extends JpaRepository<Follow, Long> {

    boolean existsByFollowerIdAndFolloweeId(Long followerId, Long followeeId);

    Optional<Follow> findByFollowerIdAndFolloweeId(Long followerId, Long followeeId);

    void deleteByFollowerIdAndFolloweeId(Long followerId, Long followeeId);

    long countByFolloweeId(Long followeeId); // followers count

    long countByFollowerId(Long followerId); // following count

    @Query("SELECT COUNT(f1) FROM Follow f1 WHERE f1.follower.id = :userId AND " +
           "EXISTS (SELECT f2 FROM Follow f2 WHERE f2.follower.id = f1.followee.id AND f2.followee.id = :userId)")
    long countFriends(@Param("userId") Long userId);

    @Query("SELECT f.follower FROM Follow f WHERE f.followee.id = :userId ORDER BY f.createdAt DESC")
    List<User> findFollowersByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT f.followee FROM Follow f WHERE f.follower.id = :userId ORDER BY f.createdAt DESC")
    List<User> findFollowingByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT f1.followee FROM Follow f1 WHERE f1.follower.id = :userId AND " +
           "EXISTS (SELECT f2 FROM Follow f2 WHERE f2.follower.id = f1.followee.id AND f2.followee.id = :userId) " +
           "ORDER BY f1.createdAt DESC")
    List<User> findFriendsByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT f.followee.id FROM Follow f WHERE f.follower.id = :userId")
    List<Long> findFolloweeIdsByFollowerId(@Param("userId") Long userId);
}
