package com.retail.inventory.repository;

import com.retail.inventory.entity.Sale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {

    Optional<Sale> findByReceiptNumber(String receiptNumber);

    boolean existsByReceiptNumber(String receiptNumber);

    Page<Sale> findByCashierId(Long cashierId, Pageable pageable);

    Page<Sale> findBySaleDateBetween(Instant start, Instant end, Pageable pageable);

    Page<Sale> findByCashierIdAndSaleDateBetween(Long cashierId, Instant start, Instant end, Pageable pageable);

    // Sales summary aggregations – executed in DB, no full load into memory
    @Query("SELECT COALESCE(SUM(s.totalAmount), 0) FROM Sale s WHERE (:start IS NULL OR s.saleDate >= :start) AND (:end IS NULL OR s.saleDate <= :end)")
    BigDecimal sumTotalAmount(@Param("start") Instant start, @Param("end") Instant end);

    @Query("SELECT COUNT(s) FROM Sale s WHERE (:start IS NULL OR s.saleDate >= :start) AND (:end IS NULL OR s.saleDate <= :end)")
    Long countSales(@Param("start") Instant start, @Param("end") Instant end);

    @Query("SELECT COALESCE(SUM(si.quantity), 0) FROM SaleItem si JOIN si.sale s WHERE (:start IS NULL OR s.saleDate >= :start) AND (:end IS NULL OR s.saleDate <= :end)")
    Long sumItemsSold(@Param("start") Instant start, @Param("end") Instant end);
}
