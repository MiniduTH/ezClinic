package com.ezclinic.telemedicine.listener;

import com.ezclinic.telemedicine.config.RabbitMQConfig;
import com.ezclinic.telemedicine.dto.SendNotificationRequest;
import com.ezclinic.telemedicine.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationListener {

    private final NotificationService notificationService;

    @RabbitListener(queues = RabbitMQConfig.NOTIFICATION_QUEUE)
    public void handleNotificationMessage(SendNotificationRequest request) {
        log.info("Received notification request from RabbitMQ for user {}", request.getUserId());
        try {
            notificationService.processAndSendNotification(request);
        } catch (Exception e) {
            log.error("Error processing RabbitMQ notification message", e);
        }
    }
}
