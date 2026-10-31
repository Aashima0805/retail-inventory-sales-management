package com.retail.inventory.repository;

import com.retail.inventory.entity.Sale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {

    Optional<Sale> findByReceiptNumber(String receiptNumber);

    boolean existsByReceiptNumber(String receiptNumber);

    Page<Sale> findByCashierId(Long cashierId, Pageable pageable);

    Page<Sale> findBySaleDateBetween(Instant start, Instant end, Pageable pageable);

    Page<Sale> findByCashierIdAndSaleDateBetween(Long cashierId, Instant start, Instant end, Pageable pageable);
}
