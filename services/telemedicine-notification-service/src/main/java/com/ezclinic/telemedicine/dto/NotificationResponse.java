package com.ezclinic.telemedicine.dto;

import com.ezclinic.telemedicine.enums.NotificationStatus;
import com.ezclinic.telemedicine.enums.NotificationType;
import com.ezclinic.telemedicine.model.Notification;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data @Builder
public class NotificationResponse {

    private UUID id;
    private UUID userId;
    private String recipientEmail;
    private NotificationType type;
    private String subject;
    private String content;
    private NotificationStatus status;
    private Instant createdAt;
    private Instant sentAt;

    public static NotificationResponse fromEntity(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .userId(notification.getUserId())
                .recipientEmail(notification.getRecipientEmail())
                .type(notification.getType())
                .subject(notification.getSubject())
                .content(notification.getContent())
                .status(notification.getStatus())
                .createdAt(notification.getCreatedAt())
                .sentAt(notification.getSentAt())
                .build();
    }
}
