package com.connecthub.controller;

import com.connecthub.dto.UserDtos;
import com.connecthub.security.UserPrincipal;
import com.connecthub.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public List<UserDtos.UserCandidate> list(@AuthenticationPrincipal UserPrincipal principal,
                                             @RequestParam(required = false) String search,
                                             @RequestParam(defaultValue = "ALL") String filter) {
        return userService.list(principal.id(), search, filter);
    }

    @GetMapping("/search")
    public List<UserDtos.UserCandidate> search(@AuthenticationPrincipal UserPrincipal principal,
                                               @RequestParam(name = "q", required = false) String query) {
        return userService.list(principal.id(), query, "ALL");
    }

    @GetMapping("/online")
    public List<UserDtos.UserCandidate> online(@AuthenticationPrincipal UserPrincipal principal) {
        return userService.list(principal.id(), null, "ONLINE");
    }

    @GetMapping("/live")
    public List<UserDtos.UserCandidate> live(@AuthenticationPrincipal UserPrincipal principal) {
        return userService.list(principal.id(), null, "LIVE");
    }

    @GetMapping("/{id}")
    public UserDtos.UserDetail detail(@AuthenticationPrincipal UserPrincipal principal,
                                      @PathVariable Long id) {
        return userService.detail(principal.id(), id);
    }
}
