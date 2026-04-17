package com.ezclinic.appointment.model;

import com.ezclinic.appointment.enums.AppointmentStatus;
import com.ezclinic.appointment.enums.AppointmentType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity @Table(name = "appointments")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Appointment {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "patient_id", nullable = false) private String patientId;
    @Column(name = "doctor_id", nullable = false) private String doctorId;
    @Column(name = "slot_id") private String slotId;
    @Column(name = "appointment_date", nullable = false) private LocalDate appointmentDate;
    @Column(name = "start_time") private String startTime;
    @Column(name = "end_time") private String endTime;

    @Enumerated(EnumType.STRING) @Column(nullable = false) @Builder.Default
    private AppointmentStatus status = AppointmentStatus.PENDING;

    @Enumerated(EnumType.STRING) @Column(nullable = false) @Builder.Default
    private AppointmentType type = AppointmentType.IN_PERSON;

    private String notes;

    @CreationTimestamp @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @OneToOne(mappedBy = "appointment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Payment payment;
}
