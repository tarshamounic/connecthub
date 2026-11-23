package com.connecthub.service;

import com.connecthub.dto.ChatDtos;
import com.connecthub.entity.ChatRequest;
import com.connecthub.entity.PrivateConversation;
import com.connecthub.entity.User;
import com.connecthub.exception.ApiException;
import com.connecthub.repository.ChatRequestRepository;
import com.connecthub.repository.PrivateConversationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatRequestService {

    private final ChatRequestRepository chatRequestRepository;
    private final PrivateConversationRepository conversationRepository;
    private final AuthService authService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ChatDtos.ChatRequestDto send(Long senderId, Long receiverId) {
        if (senderId.equals(receiverId)) {
            throw ApiException.badRequest("You cannot send a chat request to yourself");
        }
        User sender = authService.loadUser(senderId);
        User receiver = authService.loadUser(receiverId);

        long low = Math.min(senderId, receiverId);
        long high = Math.max(senderId, receiverId);
        if (conversationRepository.findByUserOneIdAndUserTwoId(low, high).isPresent()) {
            throw ApiException.conflict("You already have an accepted conversation with this user");
        }
        if (chatRequestRepository.existsBetween(senderId, receiverId, ChatRequest.Status.PENDING)) {
            throw ApiException.conflict("A pending chat request already exists between you two");
        }

        ChatRequest request = new ChatRequest();
        request.setSender(sender);
        request.setReceiver(receiver);
        request.setStatus(ChatRequest.Status.PENDING);
        chatRequestRepository.save(request);

        ChatDtos.ChatRequestDto dto = ChatDtos.chatRequest(request, null);
        notifyUser(receiver.getUsername(), dto);
        return dto;
    }

    @Transactional(readOnly = true)
    public List<ChatDtos.ChatRequestDto> incoming(Long userId) {
        return chatRequestRepository.findByReceiverId(userId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChatDtos.ChatRequestDto> outgoing(Long userId) {
        return chatRequestRepository.findBySenderId(userId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public ChatDtos.ChatRequestDto accept(Long userId, Long requestId) {
        ChatRequest request = loadActionableRequest(userId, requestId);
        request.setStatus(ChatRequest.Status.ACCEPTED);
        request.setRespondedAt(Instant.now());

        PrivateConversation conversation = getOrCreateConversation(request.getSender(), request.getReceiver());
        ChatDtos.ChatRequestDto dto = ChatDtos.chatRequest(request, conversation.getId());
        notifyUser(request.getSender().getUsername(), dto);
        return dto;
    }

    @Transactional
    public ChatDtos.ChatRequestDto reject(Long userId, Long requestId) {
        ChatRequest request = loadActionableRequest(userId, requestId);
        request.setStatus(ChatRequest.Status.REJECTED);
        request.setRespondedAt(Instant.now());

        ChatDtos.ChatRequestDto dto = ChatDtos.chatRequest(request, null);
        notifyUser(request.getSender().getUsername(), dto);
        return dto;
    }

    private ChatRequest loadActionableRequest(Long userId, Long requestId) {
        ChatRequest request = chatRequestRepository.findById(requestId)
                .orElseThrow(() -> ApiException.notFound("Chat request not found"));
        if (!request.getReceiver().getId().equals(userId)) {
            throw ApiException.forbidden("Only the recipient can respond to this request");
        }
        if (request.getStatus() != ChatRequest.Status.PENDING) {
            throw ApiException.badRequest("This chat request has already been handled");
        }
        return request;
    }

    private PrivateConversation getOrCreateConversation(User sender, User receiver) {
        long low = Math.min(sender.getId(), receiver.getId());
        long high = Math.max(sender.getId(), receiver.getId());
        return conversationRepository.findByUserOneIdAndUserTwoId(low, high)
                .orElseGet(() -> {
                    PrivateConversation conversation = new PrivateConversation();
                    conversation.setUserOne(low == sender.getId() ? sender : receiver);
                    conversation.setUserTwo(low == sender.getId() ? receiver : sender);
                    return conversationRepository.save(conversation);
                });
    }

    private ChatDtos.ChatRequestDto toDto(ChatRequest request) {
        Long conversationId = null;
        if (request.getStatus() == ChatRequest.Status.ACCEPTED) {
            long low = Math.min(request.getSender().getId(), request.getReceiver().getId());
            long high = Math.max(request.getSender().getId(), request.getReceiver().getId());
            conversationId = conversationRepository.findByUserOneIdAndUserTwoId(low, high)
                    .map(PrivateConversation::getId)
                    .orElse(null);
        }
        return ChatDtos.chatRequest(request, conversationId);
    }

    private void notifyUser(String username, ChatDtos.ChatRequestDto dto) {
        messagingTemplate.convertAndSendToUser(username, "/queue/requests", dto);
    }
}
