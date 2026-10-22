package com.partyvibe.repository;

import com.partyvibe.model.Gift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GiftRepository extends JpaRepository<Gift, Long> {

    List<Gift> findAllByOrderByCoinPriceAsc();

    Optional<Gift> findByNameIgnoreCase(String name);
}
