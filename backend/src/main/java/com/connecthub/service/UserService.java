package com.connecthub.service;

import com.connecthub.dto.UserDtos;
import com.connecthub.entity.ChatRequest;
import com.connecthub.entity.PrivateConversation;
import com.connecthub.entity.User;
import com.connecthub.exception.ApiException;
import com.connecthub.repository.ChatRequestRepository;
import com.connecthub.repository.PrivateConversationRepository;
import com.connecthub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final ChatRequestRepository chatRequestRepository;
    private final PrivateConversationRepository conversationRepository;
    private final PresenceService presenceService;
    private final AuthService authService;

    @Transactional(readOnly = true)
    public List<UserDtos.UserCandidate> list(Long currentUserId, String search, String filter) {
        String term = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        String normalizedFilter = filter == null ? "ALL" : filter.trim().toUpperCase(Locale.ROOT);

        Map<Long, String> pendingRelations = new HashMap<>();
        for (ChatRequest request : chatRequestRepository.findAllForUser(currentUserId)) {
            if (request.getStatus() != ChatRequest.Status.PENDING) {
                continue;
            }
            Long otherId = otherUserId(request, currentUserId);
            pendingRelations.putIfAbsent(otherId,
                    request.getSender().getId().equals(currentUserId) ? "PENDING_SENT" : "PENDING_RECEIVED");
        }

        Map<Long, Long> conversations = new HashMap<>();
        for (PrivateConversation conversation : conversationRepository.findAllForUser(currentUserId)) {
            conversations.put(otherUserId(conversation, currentUserId), conversation.getId());
        }

        return userRepository.findAll(Sort.by(Sort.Direction.ASC, "fullName")).stream()
                .filter(user -> !user.getId().equals(currentUserId))
                .filter(user -> term.isEmpty()
                        || user.getUsername().toLowerCase(Locale.ROOT).contains(term)
                        || user.getFullName().toLowerCase(Locale.ROOT).contains(term))
                .filter(user -> matchesFilter(presenceService.status(user.getId()), normalizedFilter))
                .map(user -> {
                    Long conversationId = conversations.get(user.getId());
                    UserDtos.Relation relation;
                    if (conversationId != null) {
                        relation = new UserDtos.Relation("ACCEPTED", null, conversationId);
                    } else {
                        String pendingStatus = pendingRelations.get(user.getId());
                        relation = pendingStatus == null
                                ? UserDtos.Relation.none()
                                : new UserDtos.Relation(pendingStatus, null, null);
                    }
                    return new UserDtos.UserCandidate(
                            user.getId(),
                            user.getFullName(),
                            user.getUsername(),
                            presenceService.status(user.getId()),
                            user.getCreatedAt(),
                            relation
                    );
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public UserDtos.UserDetail detail(Long currentUserId, Long userId) {
        User user = authService.loadUser(userId);
        if (user.getId().equals(currentUserId)) {
            return new UserDtos.UserDetail(user.getId(), user.getFullName(), user.getUsername(),
                    presenceService.status(user.getId()), user.getCreatedAt(), UserDtos.Relation.none());
        }

        PrivateConversation conversation = findConversation(currentUserId, userId);
        if (conversation != null) {
            return new UserDtos.UserDetail(user.getId(), user.getFullName(), user.getUsername(),
                    presenceService.status(user.getId()), user.getCreatedAt(),
                    new UserDtos.Relation("ACCEPTED", null, conversation.getId()));
        }

        var received = chatRequestRepository.findFirstBySenderIdAndReceiverIdAndStatusOrderByCreatedAtDesc(
                userId, currentUserId, ChatRequest.Status.PENDING);
        if (received.isPresent()) {
            return new UserDtos.UserDetail(user.getId(), user.getFullName(), user.getUsername(),
                    presenceService.status(user.getId()), user.getCreatedAt(),
                    new UserDtos.Relation("PENDING_RECEIVED", received.get().getId(), null));
        }

        var sent = chatRequestRepository.findFirstBySenderIdAndReceiverIdAndStatusOrderByCreatedAtDesc(
                currentUserId, userId, ChatRequest.Status.PENDING);
        if (sent.isPresent()) {
            return new UserDtos.UserDetail(user.getId(), user.getFullName(), user.getUsername(),
                    presenceService.status(user.getId()), user.getCreatedAt(),
                    new UserDtos.Relation("PENDING_SENT", sent.get().getId(), null));
        }

        return new UserDtos.UserDetail(user.getId(), user.getFullName(), user.getUsername(),
                presenceService.status(user.getId()), user.getCreatedAt(), UserDtos.Relation.none());
    }

    private PrivateConversation findConversation(Long first, Long second) {
        long low = Math.min(first, second);
        long high = Math.max(first, second);
        return conversationRepository.findByUserOneIdAndUserTwoId(low, high).orElse(null);
    }

    private boolean matchesFilter(String status, String filter) {
        return switch (filter) {
            case "ONLINE" -> PresenceService.ONLINE.equals(status) || PresenceService.LIVE.equals(status);
            case "OFFLINE" -> PresenceService.OFFLINE.equals(status);
            case "LIVE" -> PresenceService.LIVE.equals(status);
            default -> true;
        };
    }

    private Long otherUserId(ChatRequest request, Long currentUserId) {
        return request.getSender().getId().equals(currentUserId)
                ? request.getReceiver().getId()
                : request.getSender().getId();
    }

    private Long otherUserId(PrivateConversation conversation, Long currentUserId) {
        return conversation.getUserOne().getId().equals(currentUserId)
                ? conversation.getUserTwo().getId()
                : conversation.getUserOne().getId();
    }
}
