package com.retail.inventory.service;

import com.retail.inventory.dto.CategoryRequest;
import com.retail.inventory.dto.CategoryResponse;
import com.retail.inventory.entity.Category;
import com.retail.inventory.exception.DuplicateResourceException;
import com.retail.inventory.exception.ResourceNotFoundException;
import com.retail.inventory.repository.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryService categoryService;

    private Category beverages;

    @BeforeEach
    void setUp() {
        beverages = new Category(1L, "Beverages", "Drinks");
    }

    @Test
    void getCategories_ShouldReturnPagedResponses() {
        Page<Category> page = new PageImpl<>(List.of(beverages));
        when(categoryRepository.findAll(any(PageRequest.class))).thenReturn(page);

        Page<CategoryResponse> result = categoryService.getCategories(PageRequest.of(0, 10));

        assertEquals(1, result.getTotalElements());
        assertEquals("Beverages", result.getContent().get(0).getName());
    }

    @Test
    void getCategoryById_WhenFound_ShouldReturnResponse() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(beverages));

        CategoryResponse response = categoryService.getCategoryById(1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Beverages", response.getName());
    }

    @Test
    void getCategoryById_WhenNotFound_ShouldThrowException() {
        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> categoryService.getCategoryById(99L));
    }

    @Test
    void createCategory_WhenValid_ShouldSaveAndReturnResponse() {
        CategoryRequest request = new CategoryRequest("Dairy", "Fresh Dairy");
        when(categoryRepository.existsByNameIgnoreCase("Dairy")).thenReturn(false);
        when(categoryRepository.save(any(Category.class)))
                .thenReturn(new Category(2L, "Dairy", "Fresh Dairy"));

        CategoryResponse response = categoryService.createCategory(request);

        assertNotNull(response);
        assertEquals(2L, response.getId());
        assertEquals("Dairy", response.getName());
        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    void createCategory_WhenDuplicateName_ShouldThrowDuplicateResourceException() {
        CategoryRequest request = new CategoryRequest("Beverages", "Drinks");
        when(categoryRepository.existsByNameIgnoreCase("Beverages")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> categoryService.createCategory(request));
        verify(categoryRepository, never()).save(any(Category.class));
    }

    @Test
    void updateCategory_WhenValid_ShouldSaveAndReturnResponse() {
        CategoryRequest request = new CategoryRequest("Hot Beverages", "Teas and coffees");
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(beverages));
        when(categoryRepository.existsByNameIgnoreCaseAndIdNot("Hot Beverages", 1L)).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenReturn(beverages);

        CategoryResponse response = categoryService.updateCategory(1L, request);

        assertNotNull(response);
        assertEquals("Hot Beverages", response.getName());
        verify(categoryRepository).save(beverages);
    }

    @Test
    void updateCategory_WhenDuplicateNameOnOtherCategory_ShouldThrowException() {
        CategoryRequest request = new CategoryRequest("Dairy", "Drinks");
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(beverages));
        when(categoryRepository.existsByNameIgnoreCaseAndIdNot("Dairy", 1L)).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> categoryService.updateCategory(1L, request));
        verify(categoryRepository, never()).save(any(Category.class));
    }

    @Test
    void updateCategory_WhenCategoryNotFound_ShouldThrowException() {
        CategoryRequest request = new CategoryRequest("Snacks", "Chips");
        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> categoryService.updateCategory(99L, request));
    }
}
