package com.retail.inventory.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class StockReceiptItemRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "Quantity received is required")
    @Min(value = 1, message = "Quantity received must be greater than zero")
    private Integer quantityReceived;

    @NotNull(message = "Unit cost is required")
    @DecimalMin(value = "0.00", inclusive = true, message = "Unit cost must be non-negative")
    private BigDecimal unitCost;

    public StockReceiptItemRequest() {
    }

    public StockReceiptItemRequest(Long productId, Integer quantityReceived, BigDecimal unitCost) {
        this.productId = productId;
        this.quantityReceived = quantityReceived;
        this.unitCost = unitCost;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public Integer getQuantityReceived() {
        return quantityReceived;
    }

    public void setQuantityReceived(Integer quantityReceived) {
        this.quantityReceived = quantityReceived;
    }

    public BigDecimal getUnitCost() {
        return unitCost;
    }

    public void setUnitCost(BigDecimal unitCost) {
        this.unitCost = unitCost;
    }
}
