package com.retail.inventory.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    // Valid 256-bit (32 bytes) Base64 secret
    private static final String VALID_BASE64_SECRET =
            Base64.getEncoder().encodeToString("12345678901234567890123456789012".getBytes());

    private JwtTokenProvider tokenProvider;

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProvider(VALID_BASE64_SECRET, 60000L); // 1 minute
    }

    @Test
    void generateToken_ShouldCreateValidTokenWithCorrectClaims() {
        String username = "alice";
        Integer tokenVersion = 3;
        String role = "ROLE_CASHIER";

        String token = tokenProvider.generateToken(username, tokenVersion, role);

        assertNotNull(token);
        assertTrue(tokenProvider.validateToken(token));
        assertEquals(username, tokenProvider.getUsernameFromToken(token));
        assertEquals(tokenVersion, tokenProvider.getTokenVersionFromToken(token));
        assertEquals(role, tokenProvider.getRoleFromToken(token));
    }

    @Test
    void validateToken_ShouldReturnFalseForTamperedToken() {
        String token = tokenProvider.generateToken("bob", 1, "ROLE_ADMIN");
        String tamperedToken = token + "xyz";

        assertFalse(tokenProvider.validateToken(tamperedToken));
    }

    @Test
    void validateToken_ShouldReturnFalseForExpiredToken() throws InterruptedException {
        // Create provider with 1 millisecond expiration
        JwtTokenProvider shortLivedProvider = new JwtTokenProvider(VALID_BASE64_SECRET, 1L);
        String token = shortLivedProvider.generateToken("charlie", 1, "ROLE_INVENTORY_STAFF");

        Thread.sleep(10); // Wait for token to expire

        assertFalse(shortLivedProvider.validateToken(token));
    }

    @Test
    void constructor_ShouldThrowExceptionIfSecretIsLessThan256Bits() {
        // Only 16 bytes (128 bits)
        String shortSecret = Base64.getEncoder().encodeToString("short-secret-123".getBytes());

        assertThrows(IllegalArgumentException.class, () -> new JwtTokenProvider(shortSecret, 60000L));
    }
}
