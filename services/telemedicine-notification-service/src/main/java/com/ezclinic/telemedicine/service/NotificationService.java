package com.ezclinic.telemedicine.service;

import com.ezclinic.telemedicine.dto.NotificationResponse;
import com.ezclinic.telemedicine.dto.SendNotificationRequest;
import com.ezclinic.telemedicine.enums.NotificationStatus;
import com.ezclinic.telemedicine.enums.NotificationType;
import com.ezclinic.telemedicine.model.Notification;
import com.ezclinic.telemedicine.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmailService emailService;

    @Transactional
    public NotificationResponse processAndSendNotification(SendNotificationRequest request) {
        Notification notification = Notification.builder()
                .userId(request.getUserId())
                .recipientEmail(request.getRecipientEmail())
                .type(request.getType())
                .subject(request.getSubject())
                .content(request.getContent())
                .status(NotificationStatus.PENDING)
                .build();
        
        notification = notificationRepository.save(notification);

        try {
            if (request.getType() == NotificationType.EMAIL) {
                emailService.sendEmail(request.getRecipientEmail(), request.getSubject(), request.getContent());
            }
            notification.setStatus(NotificationStatus.SENT);
            notification.setSentAt(Instant.now());
            log.info("Notification {} sent successfully", notification.getId());
        } catch (Exception e) {
            notification.setStatus(NotificationStatus.FAILED);
            log.error("Failed to send notification {}: {}", notification.getId(), e.getMessage());
        }

        return NotificationResponse.fromEntity(notificationRepository.save(notification));
    }

    public List<NotificationResponse> getUserNotifications(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(NotificationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public NotificationResponse getNotification(UUID id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + id));
        return NotificationResponse.fromEntity(notification);
    }
}
