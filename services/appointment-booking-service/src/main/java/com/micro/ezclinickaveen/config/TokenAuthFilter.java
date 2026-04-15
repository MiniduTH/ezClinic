package com.micro.ezclinickaveen.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@Profile("!test")
@Slf4j
public class TokenAuthFilter extends OncePerRequestFilter {
    private static final Pattern SUB_PATTERN = Pattern.compile("\"sub\"\\s*:\\s*\"([^\"]*)\"");
    private static final Pattern EXP_PATTERN = Pattern.compile("\"exp\"\\s*:\\s*(\\d+)");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            unauthorized(response, "Missing Authorization bearer token");
            return;
        }

        String token = authorization.substring(7).trim();
        if (token.isEmpty()) {
            unauthorized(response, "Missing Authorization bearer token");
            return;
        }

        String payload = decodePayload(token);
        if (payload == null) {
            unauthorized(response, "Invalid token payload");
            return;
        }

        Long exp = extractExp(payload);
        if (exp != null && Instant.now().getEpochSecond() >= exp) {
            unauthorized(response, "Token has expired");
            return;
        }

        String subject = extractSub(payload);
        log.info("Authenticated subject={} path={}", subject, request.getRequestURI());

        filterChain.doFilter(request, response);
    }

    private String decodePayload(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length < 2) return null;
            byte[] decoded = Base64.getUrlDecoder().decode(parts[1]);
            return new String(decoded, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return null;
        }
    }

    private String extractSub(String payload) {
        Matcher matcher = SUB_PATTERN.matcher(payload);
        return matcher.find() ? matcher.group(1) : "unknown";
    }

    private Long extractExp(String payload) {
        Matcher matcher = EXP_PATTERN.matcher(payload);
        if (!matcher.find()) return null;
        try {
            return Long.parseLong(matcher.group(1));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private void unauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"message\":\"" + message + "\"}");
    }
}
