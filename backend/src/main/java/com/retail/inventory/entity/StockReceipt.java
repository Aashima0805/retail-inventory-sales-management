package com.retail.inventory.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "stock_receipts")
public class StockReceipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "receipt_reference", unique = true, nullable = false, length = 60)
    private String receiptReference;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "received_by_user_id", nullable = false)
    private User receivedBy;

    @Column(name = "received_date", nullable = false)
    private Instant receivedDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "total_quantity_received", nullable = false)
    private Integer totalQuantityReceived;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "stockReceipt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StockReceiptItem> items = new ArrayList<>();

    public StockReceipt() {
    }

    public StockReceipt(Long id, String receiptReference, Supplier supplier, User receivedBy,
                        Instant receivedDate, String notes, Integer totalQuantityReceived) {
        this.id = id;
        this.receiptReference = receiptReference;
        this.supplier = supplier;
        this.receivedBy = receivedBy;
        this.receivedDate = receivedDate;
        this.notes = notes;
        this.totalQuantityReceived = totalQuantityReceived;
    }

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (receivedDate == null) {
            receivedDate = now;
        }
    }

    public void addItem(StockReceiptItem item) {
        items.add(item);
        item.setStockReceipt(this);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getReceiptReference() {
        return receiptReference;
    }

    public void setReceiptReference(String receiptReference) {
        this.receiptReference = receiptReference;
    }

    public Supplier getSupplier() {
        return supplier;
    }

    public void setSupplier(Supplier supplier) {
        this.supplier = supplier;
    }

    public User getReceivedBy() {
        return receivedBy;
    }

    public void setReceivedBy(User receivedBy) {
        this.receivedBy = receivedBy;
    }

    public Instant getReceivedDate() {
        return receivedDate;
    }

    public void setReceivedDate(Instant receivedDate) {
        this.receivedDate = receivedDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Integer getTotalQuantityReceived() {
        return totalQuantityReceived;
    }

    public void setTotalQuantityReceived(Integer totalQuantityReceived) {
        this.totalQuantityReceived = totalQuantityReceived;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public List<StockReceiptItem> getItems() {
        return items;
    }

    public void setItems(List<StockReceiptItem> items) {
        this.items = items;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof StockReceipt that)) return false;
        return Objects.equals(id, that.id) && Objects.equals(receiptReference, that.receiptReference);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, receiptReference);
    }
}
