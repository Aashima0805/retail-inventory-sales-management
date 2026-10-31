package com.retail.inventory.dto;

import java.math.BigDecimal;

public class InventoryReportResponse {

    private Long productId;
    private String sku;
    private String name;
    private Integer currentStock;
    private Integer reorderLevel;
    private Boolean isActive;
    private Boolean isLowStock;
    private BigDecimal price;

    public InventoryReportResponse() {
    }

    public InventoryReportResponse(Long productId, String sku, String name, Integer currentStock,
                                   Integer reorderLevel, Boolean isActive, Boolean isLowStock, BigDecimal price) {
        this.productId = productId;
        this.sku = sku;
        this.name = name;
        this.currentStock = currentStock;
        this.reorderLevel = reorderLevel;
        this.isActive = isActive;
        this.isLowStock = isLowStock;
        this.price = price;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getCurrentStock() {
        return currentStock;
    }

    public void setCurrentStock(Integer currentStock) {
        this.currentStock = currentStock;
    }

    public Integer getReorderLevel() {
        return reorderLevel;
    }

    public void setReorderLevel(Integer reorderLevel) {
        this.reorderLevel = reorderLevel;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Boolean getIsLowStock() {
        return isLowStock;
    }

    public void setIsLowStock(Boolean isLowStock) {
        this.isLowStock = isLowStock;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }
}
