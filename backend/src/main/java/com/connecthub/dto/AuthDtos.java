package com.connecthub.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank(message = "Full name is required")
            @Size(max = 80, message = "Full name must be 80 characters or fewer")
            String fullName,

            @NotBlank(message = "Username is required")
            @Size(min = 3, max = 30, message = "Username must be between 3 and 30 characters")
            @Pattern(regexp = "^[a-zA-Z0-9_.]+$", message = "Username can only contain letters, numbers, dots and underscores")
            String username,

            @NotBlank(message = "Email is required")
            @Email(message = "Enter a valid email address")
            @Size(max = 120, message = "Email must be 120 characters or fewer")
            String email,

            @NotBlank(message = "Password is required")
            @Size(min = 6, max = 72, message = "Password must be between 6 and 72 characters")
            String password,

            @NotBlank(message = "Please confirm your password")
            String confirmPassword
    ) {
    }

    public record LoginRequest(
            @NotBlank(message = "Username or email is required")
            String identifier,

            @NotBlank(message = "Password is required")
            String password
    ) {
    }

    public record AuthResponse(String token, UserDtos.UserProfile user) {
    }
}
