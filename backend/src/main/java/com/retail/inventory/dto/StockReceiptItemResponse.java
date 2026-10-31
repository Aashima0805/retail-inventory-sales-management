package com.retail.inventory.dto;

import com.retail.inventory.entity.StockReceiptItem;

import java.math.BigDecimal;

public class StockReceiptItemResponse {

    private Long id;
    private Long productId;
    private String productSku;
    private String productName;
    private Integer quantityReceived;
    private BigDecimal unitCost;

    public StockReceiptItemResponse() {
    }

    public StockReceiptItemResponse(Long id, Long productId, String productSku, String productName,
                                    Integer quantityReceived, BigDecimal unitCost) {
        this.id = id;
        this.productId = productId;
        this.productSku = productSku;
        this.productName = productName;
        this.quantityReceived = quantityReceived;
        this.unitCost = unitCost;
    }

    public static StockReceiptItemResponse fromEntity(StockReceiptItem item) {
        if (item == null) {
            return null;
        }
        return new StockReceiptItemResponse(
                item.getId(),
                item.getProduct().getId(),
                item.getProduct().getSku(),
                item.getProduct().getName(),
                item.getQuantityReceived(),
                item.getUnitCost()
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
