package com.ezclinic.appointment.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "ezclinic.events";

    // Queues
    public static final String APPOINTMENT_EVENTS_QUEUE = "appointment.events.queue";
    public static final String PAYMENT_EVENTS_QUEUE = "payment.events.queue";

    // Routing keys
    public static final String APPOINTMENT_BOOKED_KEY = "appointment.booked";
    public static final String APPOINTMENT_CANCELLED_KEY = "appointment.cancelled";
    public static final String APPOINTMENT_STATUS_UPDATED_KEY = "appointment.status.updated";
    public static final String PAYMENT_COMPLETED_KEY = "payment.completed";

    @Bean
    public TopicExchange ezclinicExchange() {
        return new TopicExchange(EXCHANGE_NAME);
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
    public Binding appointmentBinding(Queue appointmentEventsQueue, TopicExchange ezclinicExchange) {
        return BindingBuilder.bind(appointmentEventsQueue).to(ezclinicExchange).with("appointment.#");
    }

    @Bean
    public Binding paymentBinding(Queue paymentEventsQueue, TopicExchange ezclinicExchange) {
        return BindingBuilder.bind(paymentEventsQueue).to(ezclinicExchange).with("payment.#");
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}
