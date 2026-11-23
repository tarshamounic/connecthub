package com.connecthub.websocket;

import com.connecthub.security.UserPrincipal;
import com.connecthub.service.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
@RequiredArgsConstructor
public class PresenceEventListener {

    private final PresenceService presenceService;

    @EventListener
    public void onConnected(SessionConnectedEvent event) {
        String sessionId = StompHeaderAccessor.wrap(event.getMessage()).getSessionId();
        if (event.getUser() instanceof Authentication authentication
                && authentication.getPrincipal() instanceof UserPrincipal principal
                && sessionId != null) {
            presenceService.connected(principal, sessionId);
        }
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        presenceService.disconnected(event.getSessionId());
    }
}
