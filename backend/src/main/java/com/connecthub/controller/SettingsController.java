package com.connecthub.controller;

import com.connecthub.dto.UserDtos;
import com.connecthub.security.UserPrincipal;
import com.connecthub.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final AuthService authService;

    @GetMapping("/profile")
    public UserDtos.UserProfile profile(@AuthenticationPrincipal UserPrincipal principal) {
        return authService.profile(principal);
    }
}
