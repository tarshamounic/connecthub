package com.connecthub.service;

import com.connecthub.dto.ChatDtos;
import com.connecthub.dto.UserDtos;
import com.connecthub.entity.PrivateConversation;
import com.connecthub.entity.PrivateMessage;
import com.connecthub.entity.User;
import com.connecthub.exception.ApiException;
import com.connecthub.repository.PrivateConversationRepository;
import com.connecthub.repository.PrivateMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final PrivateConversationRepository conversationRepository;
    private final PrivateMessageRepository messageRepository;
    private final AuthService authService;
    private final PresenceService presenceService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional(readOnly = true)
    public List<ChatDtos.ConversationDto> list(Long userId) {
        return conversationRepository.findAllForUser(userId).stream()
                .map(conversation -> {
                    User other = otherUser(conversation, userId);
                    String lastMessage = messageRepository
                            .findTop1ByConversationIdOrderByCreatedAtDesc(conversation.getId())
                            .map(PrivateMessage::getContent)
                            .orElse(null);
                    return ChatDtos.conversation(conversation, other,
                            presenceService.status(other.getId()), lastMessage);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public ChatDtos.ConversationDto detail(Long userId, Long conversationId) {
        PrivateConversation conversation = loadForParticipant(userId, conversationId);
        User other = otherUser(conversation, userId);
        String lastMessage = messageRepository
                .findTop1ByConversationIdOrderByCreatedAtDesc(conversationId)
                .map(PrivateMessage::getContent)
                .orElse(null);
        return ChatDtos.conversation(conversation, other,
                presenceService.status(other.getId()), lastMessage);
    }

    @Transactional(readOnly = true)
    public List<ChatDtos.PrivateMessageDto> messages(Long userId, Long conversationId) {
        loadForParticipant(userId, conversationId);
        List<PrivateMessage> messages = new ArrayList<>(
                messageRepository.findTop100ByConversationIdOrderByCreatedAtDesc(conversationId));
        Collections.reverse(messages);
        return messages.stream().map(ChatDtos::privateMessage).toList();
    }

    @Transactional
    public ChatDtos.PrivateMessageDto send(Long userId, Long conversationId, String rawContent) {
        String content = validateContent(rawContent);
        PrivateConversation conversation = loadForParticipant(userId, conversationId);
        User sender = authService.loadUser(userId);

        PrivateMessage message = new PrivateMessage();
        message.setConversation(conversation);
        message.setSender(sender);
        message.setContent(content);
        messageRepository.save(message);

        conversation.setLastMessageAt(message.getCreatedAt());
        presenceService.markActive(userId);

        ChatDtos.PrivateMessageDto dto = ChatDtos.privateMessage(message);
        messagingTemplate.convertAndSendToUser(
                conversation.getUserOne().getUsername(), "/queue/private", dto);
        messagingTemplate.convertAndSendToUser(
                conversation.getUserTwo().getUsername(), "/queue/private", dto);
        return dto;
    }

    private PrivateConversation loadForParticipant(Long userId, Long conversationId) {
        PrivateConversation conversation = conversationRepository.findDetailedById(conversationId)
                .orElseThrow(() -> ApiException.notFound("Conversation not found"));
        boolean participant = conversation.getUserOne().getId().equals(userId)
                || conversation.getUserTwo().getId().equals(userId);
        if (!participant) {
            throw ApiException.forbidden("You are not a participant in this conversation");
        }
        return conversation;
    }

    private User otherUser(PrivateConversation conversation, Long userId) {
        return conversation.getUserOne().getId().equals(userId)
                ? conversation.getUserTwo()
                : conversation.getUserOne();
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
