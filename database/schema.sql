-- ConnectHub database schema (MySQL 8.0+)
-- The Spring Boot backend also creates/updates these tables via Hibernate (ddl-auto=update).
-- Run this file as a MySQL administrator if you prefer to create the schema manually.

CREATE DATABASE IF NOT EXISTS connecthub
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'connecthub'@'localhost' IDENTIFIED BY 'connecthub123';
GRANT ALL PRIVILEGES ON connecthub.* TO 'connecthub'@'localhost';
FLUSH PRIVILEGES;

USE connecthub;

CREATE TABLE IF NOT EXISTS users (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    full_name     VARCHAR(80)  NOT NULL,
    username      VARCHAR(30)  NOT NULL,
    email         VARCHAR(120) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    created_at    DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_users_username UNIQUE (username),
    CONSTRAINT uk_users_email UNIQUE (email)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS global_messages (
    id         BIGINT        NOT NULL AUTO_INCREMENT,
    sender_id  BIGINT        NOT NULL,
    content    VARCHAR(2000) NOT NULL,
    created_at DATETIME(6)   NOT NULL,
    PRIMARY KEY (id),
    KEY idx_global_messages_created_at (created_at),
    KEY idx_global_messages_sender (sender_id),
    CONSTRAINT fk_global_messages_sender FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS chat_requests (
    id           BIGINT      NOT NULL AUTO_INCREMENT,
    sender_id    BIGINT      NOT NULL,
    receiver_id  BIGINT      NOT NULL,
    status       VARCHAR(20) NOT NULL,
    created_at   DATETIME(6) NOT NULL,
    responded_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    KEY idx_chat_requests_receiver (receiver_id, status),
    KEY idx_chat_requests_sender (sender_id, status),
    CONSTRAINT fk_chat_requests_sender FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_requests_receiver FOREIGN KEY (receiver_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS private_conversations (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    user_one_id     BIGINT      NOT NULL,
    user_two_id     BIGINT      NOT NULL,
    created_at      DATETIME(6) NOT NULL,
    last_message_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_private_conversations_pair UNIQUE (user_one_id, user_two_id),
    CONSTRAINT fk_conversations_user_one FOREIGN KEY (user_one_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_conversations_user_two FOREIGN KEY (user_two_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS private_messages (
    id              BIGINT        NOT NULL AUTO_INCREMENT,
    conversation_id BIGINT        NOT NULL,
    sender_id       BIGINT        NOT NULL,
    content         VARCHAR(2000) NOT NULL,
    created_at      DATETIME(6)   NOT NULL,
    PRIMARY KEY (id),
    KEY idx_private_messages_conversation (conversation_id, created_at),
    CONSTRAINT fk_private_messages_conversation FOREIGN KEY (conversation_id)
        REFERENCES private_conversations (id) ON DELETE CASCADE,
    CONSTRAINT fk_private_messages_sender FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB;
