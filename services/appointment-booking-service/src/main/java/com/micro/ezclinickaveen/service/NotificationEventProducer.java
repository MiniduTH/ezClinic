package com.micro.ezclinickaveen.service;

import com.micro.ezclinickaveen.config.RabbitMQConfig;
import com.micro.ezclinickaveen.dto.PaymentSuccessEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationEventProducer {

    private final RabbitTemplate rabbitTemplate;

    public void sendPaymentSuccessNotification(PaymentSuccessEvent event) {
        log.info("Publishing PaymentSuccessEvent to RabbitMQ for appointment: {}", event.getAppointmentId());
        try {
            rabbitTemplate.convertAndSend(RabbitMQConfig.EVENTS_EXCHANGE, RabbitMQConfig.PAYMENT_ROUTING_KEY, event);
            log.info("Message published to {}/{}", RabbitMQConfig.EVENTS_EXCHANGE, RabbitMQConfig.PAYMENT_ROUTING_KEY);
        } catch (Exception e) {
            log.error("Failed to publish message to RabbitMQ", e);
        }
    }
}
