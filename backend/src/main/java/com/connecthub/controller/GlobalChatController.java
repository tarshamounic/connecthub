package com.connecthub.controller;

import com.connecthub.dto.ChatDtos;
import com.connecthub.security.UserPrincipal;
import com.connecthub.service.GlobalChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/global")
@RequiredArgsConstructor
public class GlobalChatController {

    private final GlobalChatService globalChatService;

    @GetMapping("/messages")
    public List<ChatDtos.GlobalMessageDto> messages() {
        return globalChatService.list();
    }

    @PostMapping("/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatDtos.GlobalMessageDto send(@AuthenticationPrincipal UserPrincipal principal,
                                          @Valid @RequestBody ChatDtos.SendMessageRequest request) {
        return globalChatService.send(principal.id(), request.content());
    }
}
