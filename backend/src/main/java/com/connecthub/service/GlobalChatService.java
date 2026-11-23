package com.connecthub.service;

import com.connecthub.dto.ChatDtos;
import com.connecthub.entity.GlobalMessage;
import com.connecthub.entity.User;
import com.connecthub.exception.ApiException;
import com.connecthub.repository.GlobalMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GlobalChatService {

    private final GlobalMessageRepository globalMessageRepository;
    private final AuthService authService;
    private final PresenceService presenceService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional(readOnly = true)
    public List<ChatDtos.GlobalMessageDto> list() {
        List<GlobalMessage> messages = new ArrayList<>(globalMessageRepository.findTop100ByOrderByIdDesc());
        Collections.reverse(messages);
        return messages.stream().map(ChatDtos::globalMessage).toList();
    }

    @Transactional
    public ChatDtos.GlobalMessageDto send(Long senderId, String rawContent) {
        String content = validateContent(rawContent);
        User sender = authService.loadUser(senderId);

        GlobalMessage message = new GlobalMessage();
        message.setSender(sender);
        message.setContent(content);
        globalMessageRepository.save(message);

        presenceService.markActive(senderId);
        ChatDtos.GlobalMessageDto dto = ChatDtos.globalMessage(message);
        messagingTemplate.convertAndSend("/topic/global", dto);
        return dto;
    }

    private String validateContent(String content) {
        String trimmed = content == null ? "" : content.trim();
        if (trimmed.isEmpty()) {
            throw ApiException.badRequest("Message cannot be empty");
        }
        if (trimmed.length() > 2000) {
            throw ApiException.badRequest("Message must be 2000 characters or fewer");
        }
        return trimmed;
    }
}
