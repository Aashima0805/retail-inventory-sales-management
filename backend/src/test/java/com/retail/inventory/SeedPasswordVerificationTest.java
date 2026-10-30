package com.retail.inventory;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SeedPasswordVerificationTest {

    private static final String SEEDED_BCRYPT_HASH = "$2a$10$stq9/DpJ6a1RPT.srhtshOqbUZTJc38Ii7HjSg12IPVjjuzNA0mGK";

    @Test
    void verifySeededPasswordHashMatchesExpectedPassword() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        assertTrue(encoder.matches("password123", SEEDED_BCRYPT_HASH),
                "The seeded BCrypt hash must match 'password123'");
        assertFalse(encoder.matches("wrongPassword", SEEDED_BCRYPT_HASH),
                "The seeded BCrypt hash must not match incorrect passwords");
    }
}
