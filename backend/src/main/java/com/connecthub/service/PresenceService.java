package com.connecthub.service;

import com.connecthub.dto.ChatDtos;
import com.connecthub.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class PresenceService {

    public static final String ONLINE = "ONLINE";
    public static final String OFFLINE = "OFFLINE";
    public static final String LIVE = "LIVE";

    private static final long LIVE_WINDOW_MS = 90_000L;

    private final SimpMessagingTemplate messagingTemplate;

    private final Map<Long, Set<String>> sessions = new ConcurrentHashMap<>();
    private final Map<String, Long> sessionOwners = new ConcurrentHashMap<>();
    private final Map<Long, Long> lastActivity = new ConcurrentHashMap<>();

    public void connected(UserPrincipal principal, String sessionId) {
        sessions.computeIfAbsent(principal.id(), id -> ConcurrentHashMap.newKeySet()).add(sessionId);
        sessionOwners.put(sessionId, principal.id());
        broadcast(principal.id(), status(principal.id()));
    }

    public void disconnected(String sessionId) {
        Long userId = sessionOwners.remove(sessionId);
        if (userId == null) {
            return;
        }
        Set<String> userSessions = sessions.get(userId);
        if (userSessions != null) {
            userSessions.remove(sessionId);
            if (userSessions.isEmpty()) {
                sessions.remove(userId);
                lastActivity.remove(userId);
                broadcast(userId, OFFLINE);
            }
        }
    }

    public boolean isOnline(Long userId) {
        Set<String> userSessions = sessions.get(userId);
        return userSessions != null && !userSessions.isEmpty();
    }

    public String status(Long userId) {
        if (!isOnline(userId)) {
            return OFFLINE;
        }
        Long last = lastActivity.get(userId);
        if (last != null && System.currentTimeMillis() - last < LIVE_WINDOW_MS) {
            return LIVE;
        }
        return ONLINE;
    }

    public void markActive(Long userId) {
        if (!isOnline(userId)) {
            return;
        }
        String before = status(userId);
        lastActivity.put(userId, System.currentTimeMillis());
        if (!LIVE.equals(before)) {
            broadcast(userId, LIVE);
        }
    }

    @Scheduled(fixedRate = 15_000)
    public void expireLiveStatuses() {
        long now = System.currentTimeMillis();
        lastActivity.forEach((userId, last) -> {
            if (now - last >= LIVE_WINDOW_MS && lastActivity.remove(userId, last) && isOnline(userId)) {
                broadcast(userId, ONLINE);
            }
        });
    }

    private void broadcast(Long userId, String status) {
        messagingTemplate.convertAndSend("/topic/presence",
                new ChatDtos.PresenceEvent(userId, status));
    }
}
