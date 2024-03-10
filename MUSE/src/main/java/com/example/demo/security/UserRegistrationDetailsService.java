package com.example.demo.security;

import com.example.demo.MuseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserRegistrationDetailsService implements UserDetailsService {

    private final MuseRepository museRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return museRepository.findUserByEmail(email).map(UserRegistrationDetails::new).orElseThrow(()->new UsernameNotFoundException("User not found."));
    }


}
