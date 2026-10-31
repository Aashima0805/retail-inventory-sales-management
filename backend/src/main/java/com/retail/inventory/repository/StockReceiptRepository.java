package com.retail.inventory.repository;

import com.retail.inventory.entity.StockReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StockReceiptRepository extends JpaRepository<StockReceipt, Long> {

    Optional<StockReceipt> findByReceiptReference(String receiptReference);

    boolean existsByReceiptReference(String receiptReference);
}
