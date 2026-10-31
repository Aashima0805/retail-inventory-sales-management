package com.retail.inventory.repository;

import com.retail.inventory.entity.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    boolean existsBySkuIgnoreCase(String sku);

    boolean existsBySkuIgnoreCaseAndIdNot(String sku, Long id);

    Optional<Product> findByIdAndIsActive(Long id, Boolean isActive);

    Optional<Product> findBySkuIgnoreCase(String sku);

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.currentStock <= p.reorderLevel")
    Page<Product> findLowStockProducts(Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);

    /**
     * Returns products ranked by total quantity sold, aggregated in DB.
     * Result: [productId, sku, name, totalQtySold]
     */
    @Query("SELECT p.id, p.sku, p.name, COALESCE(SUM(si.quantity), 0) AS totalSold " +
           "FROM Product p LEFT JOIN SaleItem si ON si.product.id = p.id " +
           "GROUP BY p.id, p.sku, p.name " +
           "ORDER BY totalSold DESC")
    Page<Object[]> findTopProductsByQuantitySold(Pageable pageable);

    /** All active products for the inventory report page. */
    @Query("SELECT p FROM Product p WHERE p.isActive = true ORDER BY p.name ASC")
    Page<Product> findAllActiveForReport(Pageable pageable);
}
