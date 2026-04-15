package com.ezclinic.appointment.repository;

import com.ezclinic.appointment.enums.AppointmentStatus;
import com.ezclinic.appointment.model.Appointment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {
    Page<Appointment> findByPatientId(String patientId, Pageable pageable);
    Page<Appointment> findByDoctorId(String doctorId, Pageable pageable);
    List<Appointment> findByDoctorIdAndStatus(String doctorId, AppointmentStatus status);
    boolean existsByDoctorIdAndSlotId(String doctorId, String slotId);
}
