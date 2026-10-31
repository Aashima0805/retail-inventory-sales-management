package com.retail.inventory.controller;

import com.retail.inventory.dto.CreateStaffRequest;
import com.retail.inventory.dto.StaffUserResponse;
import com.retail.inventory.service.UserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<Page<StaffUserResponse>> getAllUsers(Pageable pageable) {
        return ResponseEntity.ok(userService.getAllUsers(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StaffUserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PostMapping
    public ResponseEntity<StaffUserResponse> createUser(@Valid @RequestBody CreateStaffRequest request) {
        StaffUserResponse response = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<StaffUserResponse> deactivateUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.deactivateUser(id));
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<StaffUserResponse> activateUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.activateUser(id));
    }
}
