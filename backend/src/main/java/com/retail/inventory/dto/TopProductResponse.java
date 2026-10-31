package com.retail.inventory.dto;

public class TopProductResponse {

    private Long productId;
    private String productSku;
    private String productName;
    private Long totalQuantitySold;

    public TopProductResponse() {
    }

    public TopProductResponse(Long productId, String productSku, String productName, Long totalQuantitySold) {
        this.productId = productId;
        this.productSku = productSku;
        this.productName = productName;
        this.totalQuantitySold = totalQuantitySold;
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

    public Long getTotalQuantitySold() {
        return totalQuantitySold;
    }

    public void setTotalQuantitySold(Long totalQuantitySold) {
        this.totalQuantitySold = totalQuantitySold;
    }
}
