package com.retail.inventory.dto;

/**
 * Response payload for GET /api/v1/auth/me.
 * Returns safe, non-sensitive details about the currently authenticated user.
 * Password hash is never included.
 */
public class CurrentUserResponse {

    private Long userId;
    private String username;
    private String fullName;
    private String role;

    public CurrentUserResponse() {
    }

    public CurrentUserResponse(Long userId, String username, String fullName, String role) {
        this.userId = userId;
        this.username = username;
        this.fullName = fullName;
        this.role = role;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
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
}
