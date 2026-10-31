package com.retail.inventory.dto;

import com.retail.inventory.entity.StockAdjustment;

import java.time.Instant;

public class StockAdjustmentResponse {

    private Long id;
    private Long productId;
    private String productSku;
    private String productName;
    private String performedByUsername;
    private Integer quantityChange;
    private Integer previousStock;
    private Integer newStock;
    private String reason;
    private Instant adjustmentDate;

    public StockAdjustmentResponse() {
    }

    public StockAdjustmentResponse(Long id, Long productId, String productSku, String productName,
                                   String performedByUsername, Integer quantityChange,
                                   Integer previousStock, Integer newStock, String reason,
                                   Instant adjustmentDate) {
        this.id = id;
        this.productId = productId;
        this.productSku = productSku;
        this.productName = productName;
        this.performedByUsername = performedByUsername;
        this.quantityChange = quantityChange;
        this.previousStock = previousStock;
        this.newStock = newStock;
        this.reason = reason;
        this.adjustmentDate = adjustmentDate;
    }

    public static StockAdjustmentResponse fromEntity(StockAdjustment adjustment) {
        if (adjustment == null) {
            return null;
        }
        return new StockAdjustmentResponse(
                adjustment.getId(),
                adjustment.getProduct().getId(),
                adjustment.getProduct().getSku(),
                adjustment.getProduct().getName(),
                adjustment.getUser().getUsername(),
                adjustment.getQuantityChange(),
                adjustment.getPreviousStock(),
                adjustment.getNewStock(),
                adjustment.getReason(),
                adjustment.getAdjustmentDate()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductSku() {
        return productSku;
    }

    public void setProductSku(String productSku) {
        this.productSku = productSku;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getPerformedByUsername() {
        return performedByUsername;
    }

    public void setPerformedByUsername(String performedByUsername) {
        this.performedByUsername = performedByUsername;
    }

    public Integer getQuantityChange() {
        return quantityChange;
    }

    public void setQuantityChange(Integer quantityChange) {
        this.quantityChange = quantityChange;
    }

    public Integer getPreviousStock() {
        return previousStock;
    }

    public void setPreviousStock(Integer previousStock) {
        this.previousStock = previousStock;
    }

    public Integer getNewStock() {
        return newStock;
    }

    public void setNewStock(Integer newStock) {
        this.newStock = newStock;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Instant getAdjustmentDate() {
        return adjustmentDate;
    }

    public void setAdjustmentDate(Instant adjustmentDate) {
        this.adjustmentDate = adjustmentDate;
    }
}
