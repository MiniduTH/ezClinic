package com.ezclinic.telemedicine.dto;

import com.ezclinic.telemedicine.model.Session;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data @Builder
public class SessionResponse {

    private UUID id;
    private UUID appointmentId;
    private String roomId;
    private String token;
    private String jitsiUrl;
    private Instant startedAt;
    private Instant endedAt;

    public static SessionResponse fromEntity(Session session, String jitsiDomain) {
        return SessionResponse.builder()
                .id(session.getId())
                .appointmentId(session.getAppointmentId())
                .roomId(session.getRoomId())
                .token(session.getToken())
                .jitsiUrl("https://" + jitsiDomain + "/" + session.getRoomId())
                .startedAt(session.getStartedAt())
                .endedAt(session.getEndedAt())
                .build();
    }
}
