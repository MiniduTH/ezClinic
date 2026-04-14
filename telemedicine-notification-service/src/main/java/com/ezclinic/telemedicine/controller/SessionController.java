package com.ezclinic.telemedicine.controller;

import com.ezclinic.telemedicine.dto.CreateSessionRequest;
import com.ezclinic.telemedicine.dto.SessionResponse;
import com.ezclinic.telemedicine.service.SessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/sessions")
@RequiredArgsConstructor
@Tag(name = "Telemedicine Sessions", description = "Video consultation session management via Jitsi Meet")
public class SessionController {

    private final SessionService sessionService;

    @PostMapping
    @Operation(summary = "Create a video session", description = "Creates a new Jitsi Meet session for an appointment")
    public ResponseEntity<SessionResponse> createSession(@Valid @RequestBody CreateSessionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sessionService.createSession(request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get session by ID", description = "Retrieve session details including Jitsi room URL")
    public ResponseEntity<SessionResponse> getSession(@PathVariable UUID id) {
        return ResponseEntity.ok(sessionService.getSession(id));
    }

    @GetMapping("/appointment/{appointmentId}")
    @Operation(summary = "Get session by appointment", description = "Retrieve session linked to a specific appointment")
    public ResponseEntity<SessionResponse> getSessionByAppointment(@PathVariable UUID appointmentId) {
        return ResponseEntity.ok(sessionService.getSessionByAppointment(appointmentId));
    }

    @PatchMapping("/{id}/end")
    @Operation(summary = "End a session", description = "Mark a video consultation session as ended")
    public ResponseEntity<SessionResponse> endSession(@PathVariable UUID id) {
        return ResponseEntity.ok(sessionService.endSession(id));
    }

    @GetMapping
    @Operation(summary = "List all sessions", description = "Retrieve all video sessions (admin)")
    public ResponseEntity<List<SessionResponse>> getAllSessions() {
        return ResponseEntity.ok(sessionService.getAllSessions());
    }
}
