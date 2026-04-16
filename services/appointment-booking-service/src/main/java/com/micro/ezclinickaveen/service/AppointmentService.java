package com.micro.ezclinickaveen.service;

import com.micro.ezclinickaveen.dto.AppointmentRequestDTO;
import com.micro.ezclinickaveen.dto.AppointmentResponseDTO;
import com.micro.ezclinickaveen.dto.DoctorResponseDTO;
import com.micro.ezclinickaveen.dto.RescheduleRequestDTO;
import com.micro.ezclinickaveen.exception.ResourceNotFoundException;
import com.micro.ezclinickaveen.model.Appointment;
import com.micro.ezclinickaveen.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.sql.Date;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final WebClient.Builder webClientBuilder;

    @Value("${service.doctor.url}")
    private String doctorServiceUrl;

    public AppointmentResponseDTO bookAppointment(AppointmentRequestDTO requestDTO) {
        // Step 1: Check Doctor availability via DoctorService (Mock approach)
        try {
            // This is a mocked call placeholder. In a real scenario with doctor service running:
            // DoctorResponseDTO doctor = webClientBuilder.build().get()
            //        .uri(doctorServiceUrl + "/" + requestDTO.getDoctorId())
            //        .retrieve()
            //        .bodyToMono(DoctorResponseDTO.class)
            //        .block();
            log.info("Mock checking doctor availability for doctorId: {}", requestDTO.getDoctorId());
        } catch (Exception e) {
            log.warn("Doctor service is unavailable, proceeding with mock data");
        }

        // Pre-Flight Check 1: Strict Past Date Validation
        if (requestDTO.getAppointmentDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Appointment date cannot be explicitly in the past");
        }

        // Pre-Flight Check 2: Conflict Prevention (Slot double-booking)
        boolean isConflict = appointmentRepository.existsByDoctorIdAndAppointmentDateAndSlotIdAndStatusIn(
                requestDTO.getDoctorId(),
                Date.valueOf(requestDTO.getAppointmentDate()),
                requestDTO.getSlotId(),
                Arrays.asList("PENDING", "CONFIRMED")
        );

        if (isConflict) {
            throw new IllegalStateException("This time slot is already reserved for the selected doctor.");
        }

        // Step 2: Create Appointment
        Appointment appointment = Appointment.builder()
                .patientId(requestDTO.getPatientId())
                .doctorId(requestDTO.getDoctorId())
                .slotId(requestDTO.getSlotId())
                .appointmentDate(Date.valueOf(requestDTO.getAppointmentDate()))
                .type(requestDTO.getType())
                .status("PENDING") // initial status before payment
                .build();

        // Step 3: Dynamic Pricing
        // Assuming PHYSICAL costs 2000.00 and VIRTUAL costs 1500.00
        java.math.BigDecimal amount;
        if ("PHYSICAL".equalsIgnoreCase(requestDTO.getType())) {
            amount = new java.math.BigDecimal("2000.00");
        } else {
            amount = new java.math.BigDecimal("1500.00");
        }
        
        com.micro.ezclinickaveen.model.Payment payment = com.micro.ezclinickaveen.model.Payment.builder()
                .appointment(appointment)
                .amount(amount)
                .status("PENDING")
                .build();
        appointment.setPayment(payment);

        Appointment saved = appointmentRepository.save(appointment);
        return mapToDTO(saved);
    }

    public AppointmentResponseDTO getAppointment(UUID id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id " + id));
        return mapToDTO(appointment);
    }

    public List<AppointmentResponseDTO> getAppointmentsByPatient(UUID patientId) {
        return appointmentRepository.findByPatientId(patientId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public AppointmentResponseDTO cancelAppointment(UUID id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id " + id));
        appointment.setStatus("CANCELLED");
        return mapToDTO(appointmentRepository.save(appointment));
    }

    public AppointmentResponseDTO rescheduleAppointment(UUID id, RescheduleRequestDTO requestDTO) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id " + id));

        if (requestDTO.getNewAppointmentDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Cannot reschedule to a past date");
        }

        boolean isConflict = appointmentRepository.existsByDoctorIdAndAppointmentDateAndSlotIdAndStatusIn(
                appointment.getDoctorId(),
                Date.valueOf(requestDTO.getNewAppointmentDate()),
                requestDTO.getNewSlotId(),
                Arrays.asList("PENDING", "CONFIRMED")
        );

        if (isConflict) {
            throw new IllegalStateException("The selected new time slot is already reserved.");
        }

        appointment.setAppointmentDate(Date.valueOf(requestDTO.getNewAppointmentDate()));
        appointment.setSlotId(requestDTO.getNewSlotId());
        return mapToDTO(appointmentRepository.save(appointment));
    }

    public List<AppointmentResponseDTO> getAppointmentsByDoctor(UUID doctorId) {
        return appointmentRepository.findByDoctorId(doctorId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public AppointmentResponseDTO updateStatus(UUID id, String status) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id " + id));
        appointment.setStatus(status);
        return mapToDTO(appointmentRepository.save(appointment));
    }

    public List<DoctorResponseDTO> searchDoctors(String specialty, String hospital) {
        log.info("Searching doctors via Doctor Service: specialty={}, hospital={}", specialty, hospital);
        
        try {
            return webClientBuilder.build()
                    .get()
                    .uri(uriBuilder -> uriBuilder
                            .path(doctorServiceUrl)
                            .queryParam("specialization", specialty)
                            .queryParam("search", hospital)
                            .build())
                    .retrieve()
                    .bodyToFlux(DoctorResponseDTO.class)
                    .collectList()
                    .onErrorResume(e -> {
                        log.error("Failed to fetch doctors from Doctor Service: {}", e.getMessage());
                        return Mono.just(Collections.emptyList()); // Fallback to empty list as requested
                    })
                    .block();
        } catch (Exception e) {
            log.error("Serious error during doctor search communication: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private AppointmentResponseDTO mapToDTO(Appointment appointment) {
        return AppointmentResponseDTO.builder()
                .id(appointment.getId())
                .patientId(appointment.getPatientId())
                .doctorId(appointment.getDoctorId())
                .appointmentDate(appointment.getAppointmentDate())
                .status(appointment.getStatus())
                .type(appointment.getType())
                .paymentStatus(appointment.getPayment() != null ? appointment.getPayment().getStatus() : "UNPAID")
                .amountPaid(appointment.getPayment() != null ? appointment.getPayment().getAmount() : null)
                .createdAt(appointment.getCreatedAt())
                .build();
    }
}
