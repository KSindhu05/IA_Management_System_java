package com.example.ia.security;

import com.example.ia.entity.User;
import com.example.ia.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    @Autowired
    UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        System.out.println("DEBUG: Attempting to load user: " + username);
        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> {
                    System.out.println("DEBUG: User NOT FOUND: " + username);
                    return new UsernameNotFoundException("User Not Found with username: " + username);
                });

        System.out.println("DEBUG: User found: " + user.getUsername() + ", Role: " + user.getRole() + ", Password: "
                + user.getPassword());
        return UserDetailsImpl.build(user);
    }
}
