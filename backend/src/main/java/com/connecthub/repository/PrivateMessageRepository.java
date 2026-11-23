package com.connecthub.repository;

import com.connecthub.entity.PrivateMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PrivateMessageRepository extends JpaRepository<PrivateMessage, Long> {

    List<PrivateMessage> findTop100ByConversationIdOrderByCreatedAtDesc(Long conversationId);

    Optional<PrivateMessage> findTop1ByConversationIdOrderByCreatedAtDesc(Long conversationId);
}
