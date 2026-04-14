package com.ezclinic.telemedicine.service;

import com.ezclinic.telemedicine.dto.CreateSessionRequest;
import com.ezclinic.telemedicine.dto.SessionResponse;
import com.ezclinic.telemedicine.model.Session;
import com.ezclinic.telemedicine.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionService {

    private final SessionRepository sessionRepository;

    @Value("${jitsi.domain:meet.jit.si}")
    private String jitsiDomain;

    @Transactional
    public SessionResponse createSession(CreateSessionRequest request) {
        // Prevent duplicate sessions for the same appointment
        if (sessionRepository.existsByAppointmentId(request.getAppointmentId())) {
            throw new IllegalArgumentException(
                    "A session already exists for appointment: " + request.getAppointmentId());
        }

        String roomId = "ezclinic-" + request.getAppointmentId();
        String token = UUID.randomUUID().toString(); // Simple token for now

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
}
