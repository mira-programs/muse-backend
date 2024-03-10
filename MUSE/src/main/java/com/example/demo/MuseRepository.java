package com.example.demo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

// this interface responsible for data access
@Repository
public interface MuseRepository extends JpaRepository<User, Long> {

    @Query
    Optional<User> findUserByEmail (String email);
}
