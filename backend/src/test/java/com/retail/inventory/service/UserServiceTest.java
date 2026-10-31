package com.retail.inventory.service;

import com.retail.inventory.dto.CreateStaffRequest;
import com.retail.inventory.dto.StaffUserResponse;
import com.retail.inventory.entity.Role;
import com.retail.inventory.entity.RoleName;
import com.retail.inventory.entity.User;
import com.retail.inventory.exception.DuplicateResourceException;
import com.retail.inventory.repository.RoleRepository;
import com.retail.inventory.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private Role cashierRole;
    private User testUser;

    @BeforeEach
    void setUp() {
        cashierRole = new Role(2L, RoleName.CASHIER);
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("cashier1");
        testUser.setFullName("Alice Cashier");
        testUser.setPasswordHash("hashed_pw");
        testUser.setRole(cashierRole);
        testUser.setIsActive(true);
        testUser.setTokenVersion(1);
    }

    @Test
    void getAllUsers_returnsPage() {
        when(userRepository.findAll(any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(testUser)));

        Page<StaffUserResponse> result = userService.getAllUsers(PageRequest.of(0, 10));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getUsername()).isEqualTo("cashier1");
        assertThat(result.getContent().get(0).getRole()).isEqualTo("ROLE_CASHIER");
    }

    @Test
    void createUser_success() {
        CreateStaffRequest req = new CreateStaffRequest("newuser", "New User", "secret123", "CASHIER");

        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(roleRepository.findByName("ROLE_CASHIER")).thenReturn(Optional.of(cashierRole));
        when(passwordEncoder.encode("secret123")).thenReturn("encoded_secret");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(5L);
            return u;
        });

        StaffUserResponse response = userService.createUser(req);

        assertThat(response.getId()).isEqualTo(5L);
        assertThat(response.getUsername()).isEqualTo("newuser");
        assertThat(response.getRole()).isEqualTo("ROLE_CASHIER");
        assertThat(response.getIsActive()).isEqualTo(true);
    }

    @Test
    void createUser_duplicateUsername_throwsException() {
        CreateStaffRequest req = new CreateStaffRequest("cashier1", "New User", "secret123", "CASHIER");
        when(userRepository.existsByUsername("cashier1")).thenReturn(true);

        assertThatThrownBy(() -> userService.createUser(req))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Username already exists");
    }

    @Test
    void createUser_invalidRole_throwsException() {
        CreateStaffRequest req = new CreateStaffRequest("newuser", "New User", "secret123", "SUPERUSER");
        when(userRepository.existsByUsername("newuser")).thenReturn(false);

        assertThatThrownBy(() -> userService.createUser(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid role");
    }

    @Test
    void deactivateUser_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        StaffUserResponse response = userService.deactivateUser(1L);

        assertThat(response.getIsActive()).isEqualTo(false);
        assertThat(testUser.getTokenVersion()).isEqualTo(2);
    }

    @Test
    void activateUser_success() {
        testUser.setIsActive(false);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        StaffUserResponse response = userService.activateUser(1L);

        assertThat(response.getIsActive()).isEqualTo(true);
    }
}
