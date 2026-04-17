package com.ezclinic.telemedicine.service;

import com.ezclinic.telemedicine.dto.CreateSessionRequest;
import com.ezclinic.telemedicine.dto.SessionResponse;
import com.ezclinic.telemedicine.model.Session;
import com.ezclinic.telemedicine.repository.SessionRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionService {

    private final SessionRepository sessionRepository;

    @Value("${jitsi.domain:meet.jit.si}")
    private String jitsiDomain;

    @Value("${jitsi.app-id:}")
    private String jitsiAppId;

    @Value("${jitsi.app-secret:}")
    private String jitsiAppSecret;

    @Transactional
    public SessionResponse createSession(CreateSessionRequest request) {
        // Prevent duplicate sessions for the same appointment
        if (sessionRepository.existsByAppointmentId(request.getAppointmentId())) {
            throw new IllegalArgumentException(
                    "A session already exists for appointment: " + request.getAppointmentId());
        }

        String roomId = "ezclinic-" + request.getAppointmentId();
        String token = generateJitsiToken(roomId, request);

        Session session = Session.builder()
                .appointmentId(request.getAppointmentId())
                .roomId(roomId)
                .token(token)
                .build();

        Session saved = sessionRepository.save(session);
        log.info("Session created: {} for appointment {}", saved.getId(), request.getAppointmentId());

        return SessionResponse.fromEntity(saved, jitsiDomain);
    }

    public SessionResponse getSession(UUID id) {
        Session session = sessionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + id));
        return SessionResponse.fromEntity(session, jitsiDomain);
    }

    public SessionResponse getSessionByAppointment(UUID appointmentId) {
        Session session = sessionRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No session found for appointment: " + appointmentId));
        return SessionResponse.fromEntity(session, jitsiDomain);
    }

    @Transactional
    public SessionResponse endSession(UUID id) {
        Session session = sessionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + id));

        if (session.getEndedAt() != null) {
            throw new IllegalStateException("Session is already ended");
        }

        session.setEndedAt(Instant.now());
        Session saved = sessionRepository.save(session);
        log.info("Session ended: {}", id);

        return SessionResponse.fromEntity(saved, jitsiDomain);
    }

    public List<SessionResponse> getAllSessions() {
        return sessionRepository.findAll().stream()
                .map(session -> SessionResponse.fromEntity(session, jitsiDomain))
                .toList();
    }

    /**
     * Generates a Jitsi Meet JWT room token signed with the configured app secret.
     * If no app secret is configured, returns a simple UUID fallback token.
     *
     * Token structure follows Jitsi JWT spec:
     *   iss = app_id, aud = "jitsi", sub = domain, room = roomId, exp = +2h
     */
    private String generateJitsiToken(String roomId, CreateSessionRequest request) {
        if (jitsiAppSecret == null || jitsiAppSecret.isBlank()) {
            log.warn("JITSI_APP_SECRET not configured — using fallback token for room {}", roomId);
            return UUID.randomUUID().toString();
        }

        try {
            SecretKey key = Keys.hmacShaKeyFor(jitsiAppSecret.getBytes());

            Instant now = Instant.now();
            Instant expiry = now.plusSeconds(7200); // 2-hour session

            return Jwts.builder()
                    .issuer(jitsiAppId)
                    .audience().add("jitsi").and()
                    .subject(jitsiDomain)
                    .claim("room", roomId)
                    .claim("context", Map.of(
                            "user", Map.of(
                                    "name", "ezClinic User",
                                    "email", ""
                            )
                    ))
                    .issuedAt(Date.from(now))
                    .expiration(Date.from(expiry))
                    .signWith(key)
                    .compact();
        } catch (Exception e) {
            log.error("Failed to generate Jitsi JWT for room {}: {}", roomId, e.getMessage());
            return UUID.randomUUID().toString();
        }
    }
}
