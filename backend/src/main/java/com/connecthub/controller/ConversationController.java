package com.connecthub.controller;

import com.connecthub.dto.ChatDtos;
import com.connecthub.security.UserPrincipal;
import com.connecthub.service.ConversationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;

    @GetMapping
    public List<ChatDtos.ConversationDto> list(@AuthenticationPrincipal UserPrincipal principal) {
        return conversationService.list(principal.id());
    }

    @GetMapping("/{id}")
    public ChatDtos.ConversationDto detail(@AuthenticationPrincipal UserPrincipal principal,
                                           @PathVariable Long id) {
        return conversationService.detail(principal.id(), id);
    }

    @GetMapping("/{id}/messages")
    public List<ChatDtos.PrivateMessageDto> messages(@AuthenticationPrincipal UserPrincipal principal,
                                                     @PathVariable Long id) {
        return conversationService.messages(principal.id(), id);
    }

    @PostMapping("/{id}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatDtos.PrivateMessageDto send(@AuthenticationPrincipal UserPrincipal principal,
                                           @PathVariable Long id,
                                           @Valid @RequestBody ChatDtos.SendMessageRequest request) {
        return conversationService.send(principal.id(), id, request.content());
    }
}
