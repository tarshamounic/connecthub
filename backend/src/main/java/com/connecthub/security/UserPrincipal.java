package com.connecthub.security;

import java.security.Principal;

public record UserPrincipal(Long id, String username) implements Principal {

    @Override
    public String getName() {
        return username;
    }

    public static UserPrincipal require(Principal principal) {
        if (principal instanceof org.springframework.security.core.Authentication authentication
                && authentication.getPrincipal() instanceof UserPrincipal userPrincipal) {
            return userPrincipal;
        }
        throw new IllegalStateException("No authenticated user available");
    }
}
