package com.example.demo;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;
import java.time.Month;
import java.util.List;

@Configuration
public class MuseConfig {

    @Bean
    CommandLineRunner commandLineRunner(MuseRepository repository) {
        return args -> {
            User dala = new User (
                    "Dala",
                    "Ibrahim",
                    LocalDate.of(2004, Month.JANUARY, 1),
                    "dhi02@mail.aub.edu");

            User marina = new User (
                    "Marina",
                    "Nasser",
                    LocalDate.of(2003, Month.DECEMBER, 12),
                    "mhn24@mail.aub.edu");

            repository.saveAll(
                    List.of(dala, marina)
            );
        };
    }
}
