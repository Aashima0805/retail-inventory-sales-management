package com.retail.inventory.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.retail.inventory.config.SecurityConfig;
import com.retail.inventory.dto.CreateStaffRequest;
import com.retail.inventory.dto.StaffUserResponse;
import com.retail.inventory.exception.DuplicateResourceException;
import com.retail.inventory.exception.GlobalExceptionHandler;
import com.retail.inventory.exception.ResourceNotFoundException;
import com.retail.inventory.repository.UserRepository;
import com.retail.inventory.security.JwtAuthenticationEntryPoint;
import com.retail.inventory.security.JwtAuthenticationFilter;
import com.retail.inventory.security.JwtTokenProvider;
import com.retail.inventory.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = UserController.class)
@Import({
        SecurityConfig.class,
        JwtAuthenticationFilter.class,
        JwtAuthenticationEntryPoint.class,
        GlobalExceptionHandler.class
})
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserRepository userRepository;

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void getAllUsers_asAdmin_returns200() throws Exception {
        StaffUserResponse user = new StaffUserResponse(1L, "cashier1", "Alice Cashier", "ROLE_CASHIER", true, Instant.now(), Instant.now());
        when(userService.getAllUsers(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(user)));

        mockMvc.perform(get("/api/v1/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].username").value("cashier1"))
                .andExpect(jsonPath("$.content[0].role").value("ROLE_CASHIER"));
    }

    @Test
    @WithMockUser(username = "cashier1", roles = {"CASHIER"})
    void getAllUsers_asCashier_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/users"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getAllUsers_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void createUser_asAdmin_success_returns201() throws Exception {
        CreateStaffRequest request = new CreateStaffRequest("newcashier", "New Cashier", "password123", "ROLE_CASHIER");
        StaffUserResponse response = new StaffUserResponse(10L, "newcashier", "New Cashier", "ROLE_CASHIER", true, Instant.now(), Instant.now());

        when(userService.createUser(any(CreateStaffRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("newcashier"))
                .andExpect(jsonPath("$.role").value("ROLE_CASHIER"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void createUser_duplicateUsername_returns409() throws Exception {
        CreateStaffRequest request = new CreateStaffRequest("existing", "Existing User", "password123", "ROLE_CASHIER");
        when(userService.createUser(any(CreateStaffRequest.class)))
                .thenThrow(new DuplicateResourceException("Username already exists: existing"));

        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void deactivateUser_asAdmin_returns200() throws Exception {
        StaffUserResponse response = new StaffUserResponse(2L, "cashier1", "Alice Cashier", "ROLE_CASHIER", false, Instant.now(), Instant.now());
        when(userService.deactivateUser(2L)).thenReturn(response);

        mockMvc.perform(patch("/api/v1/users/2/deactivate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isActive").value(false));
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void activateUser_asAdmin_returns200() throws Exception {
        StaffUserResponse response = new StaffUserResponse(2L, "cashier1", "Alice Cashier", "ROLE_CASHIER", true, Instant.now(), Instant.now());
        when(userService.activateUser(2L)).thenReturn(response);

        mockMvc.perform(patch("/api/v1/users/2/activate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isActive").value(true));
    }
}
