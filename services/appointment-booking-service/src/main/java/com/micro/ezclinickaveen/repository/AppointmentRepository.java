package com.micro.ezclinickaveen.repository;

import java.util.Date;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.micro.ezclinickaveen.model.Appointment;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {
    List<Appointment> findByPatientId(String patientId);
    List<Appointment> findByDoctorId(String doctorId);

    boolean existsByDoctorIdAndAppointmentDateAndSlotIdAndStatusIn(String doctorId, Date appointmentDate, String slotId, List<String> statuses);
}
