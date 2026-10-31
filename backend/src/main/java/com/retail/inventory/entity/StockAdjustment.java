package com.retail.inventory.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "stock_adjustments")
public class StockAdjustment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "quantity_change", nullable = false)
    private Integer quantityChange;

    @Column(name = "previous_stock", nullable = false)
    private Integer previousStock;

    @Column(name = "new_stock", nullable = false)
    private Integer newStock;

    @Column(name = "reason", nullable = false, length = 255)
    private String reason;

    @Column(name = "adjustment_date", nullable = false)
    private Instant adjustmentDate;

    public StockAdjustment() {
    }

    public StockAdjustment(Long id, Product product, User user, Integer quantityChange,
                           Integer previousStock, Integer newStock, String reason, Instant adjustmentDate) {
        this.id = id;
        this.product = product;
        this.user = user;
        this.quantityChange = quantityChange;
        this.previousStock = previousStock;
        this.newStock = newStock;
        this.reason = reason;
        this.adjustmentDate = adjustmentDate;
    }

    @PrePersist
    public void prePersist() {
        if (adjustmentDate == null) {
            adjustmentDate = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof StockAdjustment that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
