package com.retail.inventory.service;

import com.retail.inventory.dto.CategoryRequest;
import com.retail.inventory.dto.CategoryResponse;
import com.retail.inventory.entity.Category;
import com.retail.inventory.exception.DuplicateResourceException;
import com.retail.inventory.exception.ResourceNotFoundException;
import com.retail.inventory.repository.CategoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoryService {

    private static final Logger logger = LoggerFactory.getLogger(CategoryService.class);

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public Page<CategoryResponse> getCategories(Pageable pageable) {
        return categoryRepository.findAll(pageable)
                .map(CategoryResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .map(CategoryResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        String trimmedName = request.getName().trim();
        if (categoryRepository.existsByNameIgnoreCase(trimmedName)) {
            logger.warn("Category creation rejected: duplicate name '{}'", trimmedName);
            throw new DuplicateResourceException("Category with name '" + trimmedName + "' already exists");
        }

        Category category = new Category();
        category.setName(trimmedName);
        category.setDescription(request.getDescription());

        Category saved = categoryRepository.save(category);
        logger.info("Category created successfully: id={}, name='{}'", saved.getId(), saved.getName());
        return CategoryResponse.fromEntity(saved);
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        String trimmedName = request.getName().trim();
        if (categoryRepository.existsByNameIgnoreCaseAndIdNot(trimmedName, id)) {
            logger.warn("Category update rejected: duplicate name '{}' on id={}", trimmedName, id);
            throw new DuplicateResourceException("Category with name '" + trimmedName + "' already exists");
        }

        category.setName(trimmedName);
        category.setDescription(request.getDescription());

        Category updated = categoryRepository.save(category);
        logger.info("Category updated successfully: id={}, name='{}'", updated.getId(), updated.getName());
        return CategoryResponse.fromEntity(updated);
    }
}
