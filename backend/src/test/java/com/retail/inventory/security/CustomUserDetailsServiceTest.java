package com.retail.inventory.security;

import com.retail.inventory.entity.Role;
import com.retail.inventory.entity.RoleName;
import com.retail.inventory.entity.User;
import com.retail.inventory.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    private CustomUserDetailsService userDetailsService;

    @BeforeEach
    void setUp() {
        userDetailsService = new CustomUserDetailsService(userRepository);
    }

    @Test
    void loadUserByUsername_ShouldReturnUserDetailsForActiveUser() {
        Role role = new Role(2L, RoleName.CASHIER);
        User user = new User();
        user.setUsername("cashier1");
        user.setPasswordHash("hashed_pw");
        user.setRole(role);
        user.setIsActive(true);

        when(userRepository.findByUsername("cashier1")).thenReturn(Optional.of(user));

        UserDetails userDetails = userDetailsService.loadUserByUsername("cashier1");

        assertNotNull(userDetails);
        assertEquals("cashier1", userDetails.getUsername());
        assertTrue(userDetails.isEnabled());
    }

    @Test
    void loadUserByUsername_ShouldThrowDisabledExceptionForInactiveUser() {
        Role role = new Role(3L, RoleName.INVENTORY_STAFF);
        User user = new User();
        user.setUsername("inactive_user");
        user.setRole(role);
        user.setIsActive(false);

        when(userRepository.findByUsername("inactive_user")).thenReturn(Optional.of(user));

        assertThrows(DisabledException.class, () -> userDetailsService.loadUserByUsername("inactive_user"));
    }

    @Test
    void loadUserByUsername_ShouldThrowUsernameNotFoundExceptionWhenUserDoesNotExist() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class, () -> userDetailsService.loadUserByUsername("unknown"));
    }
}
