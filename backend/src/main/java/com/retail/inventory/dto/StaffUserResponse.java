package com.retail.inventory.dto;

import com.retail.inventory.entity.User;
import java.time.Instant;

public class StaffUserResponse {

    private Long id;
    private String username;
    private String fullName;
    private String role;
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;

    public StaffUserResponse() {
    }

    public StaffUserResponse(Long id, String username, String fullName, String role,
                             Boolean isActive, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.username = username;
        this.fullName = fullName;
        this.role = role;
        this.isActive = isActive;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static StaffUserResponse fromEntity(User user) {
        if (user == null) {
            return null;
        }
        return new StaffUserResponse(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getRole() != null ? user.getRole().getName() : null,
                user.getIsActive(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
