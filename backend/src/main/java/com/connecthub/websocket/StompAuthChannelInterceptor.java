package com.connecthub.websocket;

import com.connecthub.security.JwtService;
import com.connecthub.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authorization = accessor.getFirstNativeHeader("Authorization");
            if (authorization == null || !authorization.startsWith("Bearer ")) {
                throw new MessagingException("Authentication is required to connect");
            }
            try {
                UserPrincipal principal = jwtService.toPrincipal(authorization.substring(7));
                accessor.setUser(new UsernamePasswordAuthenticationToken(
                        principal, null, List.of(new SimpleGrantedAuthority("ROLE_USER"))));
            } catch (Exception ex) {
                throw new MessagingException("Invalid or expired authentication token");
            }
        }

        if (accessor.getUser() == null
                && (StompCommand.SEND.equals(accessor.getCommand())
                || StompCommand.SUBSCRIBE.equals(accessor.getCommand()))) {
            throw new MessagingException("Authentication is required");
        }

        if (StompCommand.SEND.equals(accessor.getCommand())) {
            String destination = accessor.getDestination();
            if (destination == null || !destination.startsWith("/app/")) {
                throw new MessagingException("Invalid destination");
            }
        }

        return message;
    }
}
