package com.connecthub.repository;

import com.connecthub.entity.PrivateConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PrivateConversationRepository extends JpaRepository<PrivateConversation, Long> {

    Optional<PrivateConversation> findByUserOneIdAndUserTwoId(Long userOneId, Long userTwoId);

    @Query("""
            select c from PrivateConversation c
            join fetch c.userOne join fetch c.userTwo
            where c.userOne.id = :userId or c.userTwo.id = :userId
            order by c.lastMessageAt desc
            """)
    List<PrivateConversation> findAllForUser(@Param("userId") Long userId);

    @Query("""
            select c from PrivateConversation c
            join fetch c.userOne join fetch c.userTwo
            where c.id = :id
            """)
    Optional<PrivateConversation> findDetailedById(@Param("id") Long id);
}
