package com.connecthub.repository;

import com.connecthub.entity.ChatRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatRequestRepository extends JpaRepository<ChatRequest, Long> {

    boolean existsBySenderIdAndReceiverIdAndStatus(Long senderId, Long receiverId, ChatRequest.Status status);

    @Query("""
            select count(r) > 0 from ChatRequest r
            where r.status = :status
              and ((r.sender.id = :first and r.receiver.id = :second)
                or (r.sender.id = :second and r.receiver.id = :first))
            """)
    boolean existsBetween(@Param("first") Long first,
                          @Param("second") Long second,
                          @Param("status") ChatRequest.Status status);

    Optional<ChatRequest> findFirstBySenderIdAndReceiverIdAndStatusOrderByCreatedAtDesc(
            Long senderId, Long receiverId, ChatRequest.Status status);

    @Query("""
            select r from ChatRequest r
            join fetch r.sender join fetch r.receiver
            where r.receiver.id = :userId
            order by r.createdAt desc
            """)
    List<ChatRequest> findByReceiverId(@Param("userId") Long userId);

    @Query("""
            select r from ChatRequest r
            join fetch r.sender join fetch r.receiver
            where r.sender.id = :userId
            order by r.createdAt desc
            """)
    List<ChatRequest> findBySenderId(@Param("userId") Long userId);

    @Query("""
            select r from ChatRequest r
            join fetch r.sender join fetch r.receiver
            where r.sender.id = :userId or r.receiver.id = :userId
            order by r.createdAt desc
            """)
    List<ChatRequest> findAllForUser(@Param("userId") Long userId);
}
