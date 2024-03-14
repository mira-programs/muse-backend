package com.example.demo;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.NaturalId;

import java.time.LocalDate;
import java.time.Period;

@Getter
@Setter
@Entity
@NoArgsConstructor
@AllArgsConstructor
public class User {
    // data members
    @Setter
    @Getter
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private String first_name;
    private String last_name;
    @Transient
    private Integer age;
    private LocalDate dob;
    @NaturalId(mutable = true)
    private String email;
    private String password;
    private boolean isEnabled = false;
    private String role;


    public User(long id, String first_name, String last_name, LocalDate dob, String email, String password, boolean isEnabled, String role) {
        this.id = id;
        this.first_name = first_name;
        this.last_name = last_name;
        this.dob = dob;
        this.email = email;
        this.password = password;
        this.isEnabled = isEnabled;
        this.role = role;
    }

    // without id
    public User(String first_name, String last_name, LocalDate dob, String email) {
        this.first_name = first_name;
        this.last_name = last_name;
        this.dob = dob;
        this.email = email;
    }

    public boolean isEnabled() {
        return isEnabled;
    }

    public void setEnabled(boolean enabled) {
        isEnabled = enabled;
    }

    public String getFirstName() {
        return first_name;
    }

    public void setFirstName(String first_name) {
        this.first_name = first_name;
    }

    public String getLastName() {
        return last_name;
    }

    public void setLastName(String last_name) {
        this.last_name = last_name;
    }

    public Integer getAge() {
        return Period.between(this.dob, LocalDate.now()).getYears();
    }

    @Override
    public String toString() {
        return "Student{" +
                "id=" + id +
                ", name='" + first_name + '\'' +
                ", name='" + last_name + '\'' +
                ", age=" + age +
                ", dob=" + dob +
                ", email='" + email + '\'' +
                '}';
    }
}