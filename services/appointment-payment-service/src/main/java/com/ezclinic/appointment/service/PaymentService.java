package com.ezclinic.appointment.service;

import com.ezclinic.appointment.dto.PaymentResponse;
import com.ezclinic.appointment.enums.AppointmentStatus;
import com.ezclinic.appointment.enums.PaymentStatus;
import com.ezclinic.appointment.model.Appointment;
import com.ezclinic.appointment.model.Payment;
import com.ezclinic.appointment.repository.AppointmentRepository;
import com.ezclinic.appointment.repository.PaymentRepository;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service @RequiredArgsConstructor @Slf4j
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final AppointmentRepository appointmentRepository;

    @Value("${stripe.secret-key}") private String stripeSecretKey;
    @Value("${stripe.webhook-secret}") private String stripeWebhookSecret;
    @Value("${app.cors.allowed-origins:http://localhost:3000}") private String frontendUrl;

    @PostConstruct
    public void init() { Stripe.apiKey = stripeSecretKey; }

    @Transactional
    public Map<String, String> createCheckoutSession(UUID appointmentId, BigDecimal amount) throws StripeException {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found: " + appointmentId));
        if (appointment.getStatus() == AppointmentStatus.CANCELLED)
            throw new IllegalStateException("Cannot pay for a cancelled appointment");
        if (paymentRepository.findByAppointmentId(appointmentId).isPresent())
            throw new IllegalStateException("Payment already exists for this appointment");

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(frontendUrl + "/appointments?payment=success&appointmentId=" + appointmentId)
                .setCancelUrl(frontendUrl + "/appointments?payment=cancelled&appointmentId=" + appointmentId)
                .addLineItem(SessionCreateParams.LineItem.builder().setQuantity(1L)
                        .setPriceData(SessionCreateParams.LineItem.PriceData.builder().setCurrency("lkr")
                                .setUnitAmount(amount.multiply(BigDecimal.valueOf(100)).longValue())
                                .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                        .setName("Consultation Fee - Appointment #" + appointmentId.toString().substring(0, 8))
                                        .setDescription("ezClinic Medical Consultation").build()).build()).build())
                .putMetadata("appointment_id", appointmentId.toString()).build();

        Session session = Session.create(params);
        paymentRepository.save(Payment.builder().appointment(appointment).amount(amount)
                .status(PaymentStatus.PENDING).stripeSessionId(session.getId()).build());
        log.info("Stripe checkout created for appointment {}: {}", appointmentId, session.getId());
        return Map.of("sessionId", session.getId(), "checkoutUrl", session.getUrl());
    }

    @Transactional
    public void handleWebhook(String payload, String sigHeader) {
        Event event;
        try { event = Webhook.constructEvent(payload, sigHeader, stripeWebhookSecret); }
        catch (SignatureVerificationException e) { throw new SecurityException("Invalid Stripe webhook signature"); }
        catch (Exception e) { throw new RuntimeException("Failed to parse Stripe webhook"); }

        if ("checkout.session.completed".equals(event.getType())) {
            Session session = (Session) event.getDataObjectDeserializer().getObject()
                    .orElseThrow(() -> new RuntimeException("Failed to deserialize Stripe session"));
            Payment payment = paymentRepository.findByStripeSessionId(session.getId())
                    .orElseThrow(() -> new RuntimeException("Payment not found for session: " + session.getId()));
            payment.setStatus(PaymentStatus.PAID);
            payment.setStripePaymentIntentId(session.getPaymentIntent());
            payment.setTransactionId(session.getPaymentIntent());
            payment.setPaidAt(LocalDateTime.now());
            paymentRepository.save(payment);
            Appointment a = payment.getAppointment();
            a.setStatus(AppointmentStatus.CONFIRMED);
            appointmentRepository.save(a);
            log.info("Payment completed for appointment {}", a.getId());
        }
    }

    public PaymentResponse getPaymentByAppointment(UUID appointmentId) {
        return PaymentResponse.fromEntity(paymentRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("No payment found for appointment: " + appointmentId)));
    }
}
