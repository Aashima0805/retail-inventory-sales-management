package com.retail.inventory.repository;

import com.retail.inventory.entity.StockReceipt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface StockReceiptRepository extends JpaRepository<StockReceipt, Long> {

    Optional<StockReceipt> findByReceiptReference(String receiptReference);

    boolean existsByReceiptReference(String receiptReference);

    @Query("SELECT sr FROM StockReceipt sr WHERE " +
           "(:start IS NULL OR sr.receivedDate >= :start) AND " +
           "(:end IS NULL OR sr.receivedDate <= :end) " +
           "ORDER BY sr.receivedDate DESC")
    Page<StockReceipt> findByDateRange(
            @Param("start") Instant start,
            @Param("end") Instant end,
            Pageable pageable);
}
