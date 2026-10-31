package com.retail.inventory.repository;

import com.retail.inventory.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
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
}
