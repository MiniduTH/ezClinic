package com.ezclinic.auth.controller;

import com.ezclinic.auth.dto.*;
import com.ezclinic.auth.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthService authService;

    @Autowired
    private ObjectMapper objectMapper;

    private UserDto sampleUser() {
        return UserDto.builder()
                .id(UUID.randomUUID()).auth0Id("auth0|12345")
                .name("Kaveen").email("kaveen@test.com").role("PATIENT")
                .createdAt(LocalDateTime.now()).build();
    }

    @Test
    @DisplayName("POST /auth/register — should register successfully")
    void register() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setName("Kaveen"); req.setEmail("kaveen@test.com");
        req.setPassword("Test1234!"); req.setRole("PATIENT");

        when(authService.register(any())).thenReturn(sampleUser());

        mockMvc.perform(post("/auth/register").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("kaveen@test.com"));
    }

    @Test
    @DisplayName("POST /auth/login — should return JWT")
    void login() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setEmail("kaveen@test.com"); req.setPassword("Test1234!");

        LoginResponse resp = LoginResponse.builder()
                .accessToken("mock-jwt").tokenType("Bearer").expiresIn(86400).user(sampleUser()).build();
        when(authService.login(any())).thenReturn(resp);

        mockMvc.perform(post("/auth/login").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").value("mock-jwt"));
    }

    @Test
    @DisplayName("POST /auth/register — should fail with invalid email")
    void registerValidationFail() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setName("Kaveen"); req.setEmail("not-an-email"); req.setPassword("Test1234!");

        mockMvc.perform(post("/auth/register").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }
}
