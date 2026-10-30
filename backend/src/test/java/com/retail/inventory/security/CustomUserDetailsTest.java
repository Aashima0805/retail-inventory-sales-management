package com.retail.inventory.security;

import com.retail.inventory.entity.Role;
import com.retail.inventory.entity.RoleName;
import com.retail.inventory.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

import static org.junit.jupiter.api.Assertions.*;

class CustomUserDetailsTest {

    @Test
    void customUserDetails_ShouldMapActiveUserAttributesCorrectly() {
        Role role = new Role(1L, RoleName.ADMIN);
        User user = new User();
        user.setId(10L);
        user.setUsername("manager1");
        user.setPasswordHash("$2a$10$xyz");
        user.setFullName("Store Manager");
        user.setRole(role);
        user.setIsActive(true);
        user.setTokenVersion(2);

        CustomUserDetails userDetails = new CustomUserDetails(user);

        assertEquals(10L, userDetails.getId());
        assertEquals("manager1", userDetails.getUsername());
        assertEquals("$2a$10$xyz", userDetails.getPassword());
        assertEquals("Store Manager", userDetails.getFullName());
        assertEquals(2, userDetails.getTokenVersion());
        assertTrue(userDetails.isEnabled());
        assertTrue(userDetails.isAccountNonLocked());
        assertTrue(userDetails.isAccountNonExpired());
        assertTrue(userDetails.isCredentialsNonExpired());

        Collection<? extends GrantedAuthority> authorities = userDetails.getAuthorities();
        assertEquals(1, authorities.size());
        assertEquals(RoleName.ADMIN, authorities.iterator().next().getAuthority());
    }

    @Test
    void customUserDetails_ShouldDisableAccountIfInactive() {
        Role role = new Role(2L, RoleName.CASHIER);
        User user = new User();
        user.setUsername("inactive_cashier");
        user.setRole(role);
        user.setIsActive(false);

        CustomUserDetails userDetails = new CustomUserDetails(user);

        assertFalse(userDetails.isEnabled());
        assertFalse(userDetails.isAccountNonLocked());
    }

    @Test
    void toString_ShouldNotExposePasswordHash() {
        Role role = new Role(1L, RoleName.ADMIN);
        User user = new User();
        user.setUsername("admin");
        user.setPasswordHash("super_secret_hash_value");
        user.setRole(role);

        CustomUserDetails userDetails = new CustomUserDetails(user);

        assertFalse(userDetails.toString().contains("super_secret_hash_value"),
                "toString() must not expose the password hash");
    }
}
