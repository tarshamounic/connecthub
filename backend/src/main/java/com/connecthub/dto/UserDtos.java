package com.connecthub.dto;

import java.time.Instant;

public final class UserDtos {

    private UserDtos() {
    }

    public record UserSummary(
            Long id,
            String fullName,
            String username,
            String status,
            Instant createdAt
    ) {
    }

    public record UserProfile(
            Long id,
            String fullName,
            String username,
            String email,
            String status,
            Instant createdAt
    ) {
    }

    public record Relation(String status, Long requestId, Long conversationId) {
        public static Relation none() {
            return new Relation("NONE", null, null);
        }
    }

    public record UserCandidate(
            Long id,
            String fullName,
            String username,
            String status,
            Instant createdAt,
            Relation relation
    ) {
    }

    public record UserDetail(
            Long id,
            String fullName,
            String username,
            String status,
            Instant createdAt,
            Relation relation
    ) {
    }
}
