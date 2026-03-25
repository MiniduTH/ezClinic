package com.ezclinic.auth.service;

import com.ezclinic.auth.dto.LoginRequest;
import com.ezclinic.auth.dto.LoginResponse;
import com.ezclinic.auth.dto.RegisterRequest;
import com.ezclinic.auth.dto.UserDto;
import com.ezclinic.auth.model.User;
import com.ezclinic.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${auth0.domain}")
    private String auth0Domain;

    @Value("${auth0.audience}")
    private String auth0Audience;

    @Value("${auth0.client-id}")
    private String clientId;

    @Value("${auth0.client-secret}")
    private String clientSecret;

    public UserDto register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        String auth0Id = createAuth0User(request);

        User user = User.builder()
                .auth0Id(auth0Id)
                .name(request.getName())
                .email(request.getEmail())
                .role(User.Role.valueOf(request.getRole()))
                .phone(request.getPhone())
                .build();

        User saved = userRepository.save(user);
        log.info("User registered: {} with role {}", saved.getEmail(), saved.getRole());
        return UserDto.fromEntity(saved);
    }

    public LoginResponse login(LoginRequest request) {
        Map<String, Object> tokenResponse = getAuth0Token(request.getEmail(), request.getPassword());

        String accessToken = (String) tokenResponse.get("access_token");
        String tokenType = (String) tokenResponse.getOrDefault("token_type", "Bearer");
        Number expiresIn = (Number) tokenResponse.getOrDefault("expires_in", 86400);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found. Please register first."));

        return LoginResponse.builder()
                .accessToken(accessToken)
                .tokenType(tokenType)
                .expiresIn(expiresIn.longValue())
                .user(UserDto.fromEntity(user))
                .build();
    }

    public UserDto getCurrentUser(String auth0Id) {
        User user = userRepository.findByAuth0Id(auth0Id)
                .orElseThrow(() -> new IllegalArgumentException("User not found for auth0 id: " + auth0Id));
        return UserDto.fromEntity(user);
    }

    private String createAuth0User(RegisterRequest request) {
        String url = "https://" + auth0Domain + "/dbconnections/signup";

        Map<String, Object> body = new HashMap<>();
        body.put("client_id", clientId);
        body.put("email", request.getEmail());
        body.put("password", request.getPassword());
        body.put("connection", "Username-Password-Authentication");
        body.put("name", request.getName());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);
            Map responseBody = response.getBody();
            if (responseBody == null || !responseBody.containsKey("_id")) {
                throw new RuntimeException("Auth0 registration failed: unexpected response");
            }
            return "auth0|" + responseBody.get("_id");
        } catch (Exception e) {
            log.error("Auth0 signup failed: {}", e.getMessage());
            throw new RuntimeException("Failed to register with Auth0: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getAuth0Token(String email, String password) {
        String url = "https://" + auth0Domain + "/oauth/token";

        Map<String, Object> body = new HashMap<>();
        body.put("grant_type", "password");
        body.put("client_id", clientId);
        body.put("client_secret", clientSecret);
        body.put("username", email);
        body.put("password", password);
        body.put("audience", auth0Audience);
        body.put("scope", "openid profile email");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("Auth0 login failed: {}", e.getMessage());
            throw new RuntimeException("Invalid credentials or Auth0 error: " + e.getMessage(), e);
        }
    }
}
