package com.connecthub.dto;

import com.connecthub.entity.ChatRequest;
import com.connecthub.entity.GlobalMessage;
import com.connecthub.entity.PrivateConversation;
import com.connecthub.entity.PrivateMessage;
import com.connecthub.entity.User;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class ChatDtos {

    private ChatDtos() {
    }

    public record GlobalMessageDto(
            Long id,
            Long senderId,
            String senderName,
            String senderUsername,
            String content,
            Instant createdAt
    ) {
    }

    public record SendMessageRequest(
            @NotBlank(message = "Message cannot be empty")
            @Size(max = 2000, message = "Message must be 2000 characters or fewer")
            String content
    ) {
    }

    public record SendPrivateRequest(
            @NotNull(message = "Conversation is required")
            Long conversationId,

            @NotBlank(message = "Message cannot be empty")
            @Size(max = 2000, message = "Message must be 2000 characters or fewer")
            String content
    ) {
    }

    public record ChatRequestDto(
            Long id,
            Long senderId,
            String senderName,
            String senderUsername,
            Long receiverId,
            String receiverName,
            String receiverUsername,
            String status,
            Instant createdAt,
            Instant respondedAt,
            Long conversationId
    ) {
    }

    public record ConversationDto(
            Long id,
            UserDtos.UserSummary otherUser,
            String lastMessage,
            Instant lastMessageAt
    ) {
    }

    public record PrivateMessageDto(
            Long id,
            Long conversationId,
            Long senderId,
            String senderName,
            String senderUsername,
            String content,
            Instant createdAt
    ) {
    }

    public record PresenceEvent(Long userId, String status) {
    }

    public static GlobalMessageDto globalMessage(GlobalMessage message) {
        User sender = message.getSender();
        return new GlobalMessageDto(
                message.getId(),
                sender.getId(),
                sender.getFullName(),
                sender.getUsername(),
                message.getContent(),
                message.getCreatedAt()
        );
    }

    public static PrivateMessageDto privateMessage(PrivateMessage message) {
        User sender = message.getSender();
        return new PrivateMessageDto(
                message.getId(),
                message.getConversation().getId(),
                sender.getId(),
                sender.getFullName(),
                sender.getUsername(),
                message.getContent(),
                message.getCreatedAt()
        );
    }

    public static ChatRequestDto chatRequest(ChatRequest request, Long conversationId) {
        return new ChatRequestDto(
                request.getId(),
                request.getSender().getId(),
                request.getSender().getFullName(),
                request.getSender().getUsername(),
                request.getReceiver().getId(),
                request.getReceiver().getFullName(),
                request.getReceiver().getUsername(),
                request.getStatus().name(),
                request.getCreatedAt(),
                request.getRespondedAt(),
                conversationId
        );
    }

    public static ConversationDto conversation(PrivateConversation conversation, User other,
                                               String otherStatus, String lastMessage) {
        return new ConversationDto(
                conversation.getId(),
                new UserDtos.UserSummary(
                        other.getId(),
                        other.getFullName(),
                        other.getUsername(),
                        otherStatus,
                        other.getCreatedAt()
                ),
                lastMessage,
                conversation.getLastMessageAt()
        );
    }
}
