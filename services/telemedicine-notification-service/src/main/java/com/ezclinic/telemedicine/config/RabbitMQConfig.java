package com.ezclinic.telemedicine.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    /** Shared exchange published by appointment-payment-service */
    public static final String EVENTS_EXCHANGE = "ezclinic.events";

    // Queues consumed by this service
    public static final String NOTIFICATION_QUEUE = "notification.queue";
    public static final String APPOINTMENT_EVENTS_QUEUE = "telemedicine.appointment.events.queue";
    public static final String PAYMENT_EVENTS_QUEUE = "telemedicine.payment.events.queue";

    /** Legacy routing key kept for internal notification dispatch */
    public static final String ROUTING_KEY = "notification.email";

    @Bean
    public TopicExchange ezclinicEventsExchange() {
        return ExchangeBuilder.topicExchange(EVENTS_EXCHANGE).durable(true).build();
    }

    @Bean
    public Queue notificationQueue() {
        return QueueBuilder.durable(NOTIFICATION_QUEUE).build();
    }

    @Bean
    public Queue appointmentEventsQueue() {
        return QueueBuilder.durable(APPOINTMENT_EVENTS_QUEUE).build();
    }

    @Bean
    public Queue paymentEventsQueue() {
        return QueueBuilder.durable(PAYMENT_EVENTS_QUEUE).build();
    }

    @Bean
    public Binding notificationBinding(Queue notificationQueue, TopicExchange ezclinicEventsExchange) {
        return BindingBuilder.bind(notificationQueue).to(ezclinicEventsExchange).with(ROUTING_KEY);
    }

    @Bean
    public Binding appointmentEventsBinding(Queue appointmentEventsQueue, TopicExchange ezclinicEventsExchange) {
        return BindingBuilder.bind(appointmentEventsQueue).to(ezclinicEventsExchange).with("appointment.#");
    }

    @Bean
    public Binding paymentEventsBinding(Queue paymentEventsQueue, TopicExchange ezclinicEventsExchange) {
        return BindingBuilder.bind(paymentEventsQueue).to(ezclinicEventsExchange).with("payment.#");
    }

    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter());
        return template;
    }
}
