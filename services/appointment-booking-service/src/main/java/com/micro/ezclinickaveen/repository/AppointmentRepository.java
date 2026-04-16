package com.micro.ezclinickaveen.repository;

import com.micro.ezclinickaveen.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.UUID;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {
    List<Appointment> findByPatientId(UUID patientId);
    List<Appointment> findByDoctorId(String doctorId);

    boolean existsByDoctorIdAndAppointmentDateAndSlotIdAndStatusIn(String doctorId, Date appointmentDate, UUID slotId, List<String> statuses);
}
