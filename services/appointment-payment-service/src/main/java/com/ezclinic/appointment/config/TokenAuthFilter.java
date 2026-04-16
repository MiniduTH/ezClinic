package com.ezclinic.appointment.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

@Component
@Profile("!test")
@Slf4j
public class TokenAuthFilter extends OncePerRequestFilter {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final String[] PUBLIC_PATHS = { "/swagger-ui", "/api-docs", "/health" };

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getServletPath();
        for (String publicPath : PUBLIC_PATHS) {
            if (path.startsWith(publicPath)) {
                filterChain.doFilter(request, response);
                return;
            }
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

        if (!verifySignature(token)) {
            unauthorized(response, "Invalid token signature");
            return;
        }

        Map<String, Object> payload = decodePayload(token);
        if (payload == null) {
            unauthorized(response, "Invalid token payload");
            return;
        }

        Object expClaim = payload.get("exp");
        if (expClaim instanceof Number exp && Instant.now().getEpochSecond() >= exp.longValue()) {
            unauthorized(response, "Token has expired");
            return;
        }

        String subject = payload.get("sub") instanceof String sub ? sub : "unknown";
        String role = payload.get("role") instanceof String r ? r : null;

        request.setAttribute("tokenSub", subject);
        if (role != null) request.setAttribute("tokenRole", role);
        log.info("[Auth] subject={} role={} path={}", subject, role, request.getRequestURI());

        filterChain.doFilter(request, response);
    }

    private boolean verifySignature(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 3) return false;
        try {
            Map<String, Object> header = decodeSection(parts[0]);
            if (header == null || !"HS256".equals(header.get("alg"))) return false;

            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] expected = mac.doFinal((parts[0] + "." + parts[1]).getBytes(StandardCharsets.UTF_8));
            byte[] actual = Base64.getUrlDecoder().decode(padBase64(parts[2]));
            return MessageDigest.isEqual(expected, actual);
        } catch (Exception e) {
            return false;
        }
    }

    private Map<String, Object> decodePayload(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length < 2) return null;
            return decodeSection(parts[1]);
        } catch (Exception e) {
            return null;
        }
    }

    private Map<String, Object> decodeSection(String base64Url) {
        try {
            byte[] decoded = Base64.getUrlDecoder().decode(padBase64(base64Url));
            return OBJECT_MAPPER.readValue(new String(decoded, StandardCharsets.UTF_8), new TypeReference<>() {});
        } catch (Exception e) {
            return null;
        }
    }

    private String padBase64(String s) {
        int rem = s.length() % 4;
        return rem == 0 ? s : s + "=".repeat(4 - rem);
    }

    private void unauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"message\":\"" + message + "\"}");
    }
}
