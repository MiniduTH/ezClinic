package com.micro.ezclinickaveen.controller;

import com.micro.ezclinickaveen.dto.AppointmentRequestDTO;
import com.micro.ezclinickaveen.dto.AppointmentResponseDTO;
import com.micro.ezclinickaveen.dto.DoctorResponseDTO;
import com.micro.ezclinickaveen.dto.RescheduleRequestDTO;
import com.micro.ezclinickaveen.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    public ResponseEntity<AppointmentResponseDTO> bookAppointment(@Valid @RequestBody AppointmentRequestDTO requestDTO) {
        return new ResponseEntity<>(appointmentService.bookAppointment(requestDTO), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppointmentResponseDTO> getAppointment(@PathVariable UUID id) {
        return ResponseEntity.ok(appointmentService.getAppointment(id));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<AppointmentResponseDTO>> getPatientAppointments(@PathVariable UUID patientId) {
        return ResponseEntity.ok(appointmentService.getAppointmentsByPatient(patientId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<AppointmentResponseDTO> cancelAppointment(@PathVariable UUID id) {
        return ResponseEntity.ok(appointmentService.cancelAppointment(id));
    }

    @PatchMapping("/{id}/reschedule")
    public ResponseEntity<AppointmentResponseDTO> rescheduleAppointment(
            @PathVariable UUID id,
            @Valid @RequestBody RescheduleRequestDTO requestDTO) {
        return ResponseEntity.ok(appointmentService.rescheduleAppointment(id, requestDTO));
    }

    @GetMapping("/doctors/search")
    public ResponseEntity<List<DoctorResponseDTO>> searchDoctors(
            @RequestParam(required = false) String specialty,
            @RequestParam(required = false) String hospital) {
        return ResponseEntity.ok(appointmentService.searchDoctors(specialty, hospital));
    }
}
