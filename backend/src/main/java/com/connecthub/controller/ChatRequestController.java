package com.connecthub.controller;

import com.connecthub.dto.ChatDtos;
import com.connecthub.security.UserPrincipal;
import com.connecthub.service.ChatRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class ChatRequestController {

    private final ChatRequestService chatRequestService;

    @PostMapping("/send/{userId}")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatDtos.ChatRequestDto send(@AuthenticationPrincipal UserPrincipal principal,
                                        @PathVariable Long userId) {
        return chatRequestService.send(principal.id(), userId);
    }

    @GetMapping("/incoming")
    public List<ChatDtos.ChatRequestDto> incoming(@AuthenticationPrincipal UserPrincipal principal) {
        return chatRequestService.incoming(principal.id());
    }

    @GetMapping("/outgoing")
    public List<ChatDtos.ChatRequestDto> outgoing(@AuthenticationPrincipal UserPrincipal principal) {
        return chatRequestService.outgoing(principal.id());
    }

    @PutMapping("/{id}/accept")
    public ChatDtos.ChatRequestDto accept(@AuthenticationPrincipal UserPrincipal principal,
                                          @PathVariable Long id) {
        return chatRequestService.accept(principal.id(), id);
    }

    @PutMapping("/{id}/reject")
    public ChatDtos.ChatRequestDto reject(@AuthenticationPrincipal UserPrincipal principal,
                                          @PathVariable Long id) {
        return chatRequestService.reject(principal.id(), id);
    }
}
