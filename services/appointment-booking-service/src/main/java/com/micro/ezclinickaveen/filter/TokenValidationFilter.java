package com.micro.ezclinickaveen.filter;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;

/**
 * Lightweight token validation filter.
 * Checks for Authorization header presence — returns 401 if missing.
 * Logs the token for audit purposes.
 * Does NOT perform role checks (role enforcement is frontend responsibility).
 */
public class TokenValidationFilter implements Filter {

    private static final Logger logger = LoggerFactory.getLogger(TokenValidationFilter.class);
    private static final String[] PUBLIC_ENDPOINTS = {
        "/health",
        "/actuator"
    };

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String requestPath = httpRequest.getServletPath();
        
        // Skip token validation for public endpoints
        if (isPublicEndpoint(requestPath)) {
            chain.doFilter(request, response);
            return;
        }

        String authHeader = httpRequest.getHeader("Authorization");
        
        // Check for token presence
        if (authHeader == null || authHeader.isEmpty()) {
            logger.warn("Missing Authorization header for path: {}", requestPath);
            httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            httpResponse.getWriter().write("{\"error\": \"Missing Authorization header\"}");
            return;
        }

        // Extract token (format: "Bearer <token>")
        String token = extractToken(authHeader);
        if (token == null) {
            logger.warn("Invalid Authorization header format for path: {}", requestPath);
            httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            httpResponse.getWriter().write("{\"error\": \"Invalid Authorization header format\"}");
            return;
        }

        // Log token for audit (use sparingly in production)
        logger.debug("Token received for path: {} | Token prefix: {}...", requestPath, token.substring(0, Math.min(10, token.length())));

        chain.doFilter(request, response);
    }

    private boolean isPublicEndpoint(String path) {
        for (String endpoint : PUBLIC_ENDPOINTS) {
            if (path.startsWith(endpoint)) {
                return true;
            }
        }
        return false;
    }

    private String extractToken(String authHeader) {
        if (authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }
}
