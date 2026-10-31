package com.retail.inventory.service;

import com.retail.inventory.dto.ProductRequest;
import com.retail.inventory.dto.ProductResponse;
import com.retail.inventory.entity.Category;
import com.retail.inventory.entity.Product;
import com.retail.inventory.exception.DuplicateResourceException;
import com.retail.inventory.exception.ResourceNotFoundException;
import com.retail.inventory.repository.CategoryRepository;
import com.retail.inventory.repository.ProductRepository;
import com.retail.inventory.repository.ProductSpecification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {

    private static final Logger logger = LoggerFactory.getLogger(ProductService.class);

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> searchProducts(String keyword, Long categoryId, Boolean isActive, Pageable pageable) {
        Specification<Product> spec = ProductSpecification.filter(keyword, categoryId, isActive);
        return productRepository.findAll(spec, pageable)
                .map(ProductResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        return productRepository.findById(id)
                .map(ProductResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        String trimmedSku = request.getSku().trim();
        if (productRepository.existsBySkuIgnoreCase(trimmedSku)) {
            logger.warn("Product creation rejected: duplicate SKU '{}'", trimmedSku);
            throw new DuplicateResourceException("Product with SKU '" + trimmedSku + "' already exists");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        Product product = new Product();
        product.setSku(trimmedSku);
        product.setName(request.getName().trim());
        product.setDescription(request.getDescription());
        product.setCategory(category);
        product.setPrice(request.getPrice());
        product.setReorderLevel(request.getReorderLevel());
        product.setCurrentStock(0);
        product.setIsActive(true);

        Product saved = productRepository.save(product);
        logger.info("Product created successfully: id={}, sku='{}'", saved.getId(), saved.getSku());
        return ProductResponse.fromEntity(saved);
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        String trimmedSku = request.getSku().trim();
        if (productRepository.existsBySkuIgnoreCaseAndIdNot(trimmedSku, id)) {
            logger.warn("Product update rejected: duplicate SKU '{}' on id={}", trimmedSku, id);
            throw new DuplicateResourceException("Product with SKU '" + trimmedSku + "' already exists");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        product.setSku(trimmedSku);
        product.setName(request.getName().trim());
        product.setDescription(request.getDescription());
        product.setCategory(category);
        product.setPrice(request.getPrice());
        product.setReorderLevel(request.getReorderLevel());
        // Preserves currentStock and isActive untouched

        Product updated = productRepository.save(product);
        logger.info("Product updated successfully: id={}, sku='{}'", updated.getId(), updated.getSku());
        return ProductResponse.fromEntity(updated);
    }

    @Transactional
    public void deactivateProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        product.setIsActive(false);
        productRepository.save(product);
        logger.info("Product deactivated successfully: id={}, sku='{}'", product.getId(), product.getSku());
    }
}
