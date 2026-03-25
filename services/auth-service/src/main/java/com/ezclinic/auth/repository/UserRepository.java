package com.ezclinic.auth.repository;

import com.ezclinic.auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByAuth0Id(String auth0Id);
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByAuth0Id(String auth0Id);
}
