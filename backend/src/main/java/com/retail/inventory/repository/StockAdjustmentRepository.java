package com.retail.inventory.repository;

import com.retail.inventory.entity.StockAdjustment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;

@Repository
public interface StockAdjustmentRepository extends JpaRepository<StockAdjustment, Long> {

    Page<StockAdjustment> findByProductId(Long productId, Pageable pageable);

    @Query("SELECT sa FROM StockAdjustment sa WHERE " +
           "(:start IS NULL OR sa.adjustmentDate >= :start) AND " +
           "(:end IS NULL OR sa.adjustmentDate <= :end) " +
           "ORDER BY sa.adjustmentDate DESC")
    Page<StockAdjustment> findByDateRange(
            @Param("start") Instant start,
            @Param("end") Instant end,
            Pageable pageable);
}
