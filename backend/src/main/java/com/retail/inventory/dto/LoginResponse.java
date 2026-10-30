package com.retail.inventory.dto;

/**
 * Response payload for POST /api/v1/auth/login.
 * Contains the JWT token and safe, non-sensitive user details.
 * Password hash is never included.
 */
public class LoginResponse {

    private String token;
    private String tokenType;
    private Long userId;
    private String username;
    private String fullName;
    private String role;

    public LoginResponse() {
    }

    public LoginResponse(String token, Long userId, String username, String fullName, String role) {
        this.token = token;
        this.tokenType = "Bearer";
        this.userId = userId;
        this.username = username;
        this.fullName = fullName;
        this.role = role;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
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

    @Override
    public String toString() {
        // Never include token value in toString
        return "LoginResponse{userId=" + userId + ", username='" + username + "', role='" + role + "'}";
    }
}
