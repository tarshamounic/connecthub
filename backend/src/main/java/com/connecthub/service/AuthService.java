package com.connecthub.service;

import com.connecthub.dto.AuthDtos;
import com.connecthub.dto.UserDtos;
import com.connecthub.entity.User;
import com.connecthub.exception.ApiException;
import com.connecthub.repository.UserRepository;
import com.connecthub.security.JwtService;
import com.connecthub.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PresenceService presenceService;

    @Transactional
    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request) {
        String fullName = request.fullName().trim();
        String username = request.username().trim().toLowerCase(Locale.ROOT);
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        if (!request.password().equals(request.confirmPassword())) {
            throw ApiException.badRequest("Passwords do not match");
        }
        if (userRepository.existsByUsername(username)) {
            throw ApiException.conflict("This username is already taken");
        }
        if (userRepository.existsByEmail(email)) {
            throw ApiException.conflict("An account with this email already exists");
        }

        User user = new User();
        user.setFullName(fullName);
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        userRepository.save(user);

        return new AuthDtos.AuthResponse(jwtService.generateToken(user), profile(user));
    }

    @Transactional(readOnly = true)
    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        String identifier = request.identifier().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByUsernameOrEmail(identifier, identifier)
                .orElseThrow(() -> ApiException.unauthorized("Invalid username or password"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Invalid username or password");
        }
        return new AuthDtos.AuthResponse(jwtService.generateToken(user), profile(user));
    }

    @Transactional(readOnly = true)
    public UserDtos.UserProfile profile(UserPrincipal principal) {
        return profile(loadUser(principal.id()));
    }

    public UserDtos.UserProfile profile(User user) {
        return new UserDtos.UserProfile(
                user.getId(),
                user.getFullName(),
                user.getUsername(),
                user.getEmail(),
                presenceService.status(user.getId()),
                user.getCreatedAt()
        );
    }

    public User loadUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
    }
}
