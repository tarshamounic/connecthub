package com.connecthub.websocket;

import com.connecthub.dto.ApiError;
import com.connecthub.dto.ChatDtos;
import com.connecthub.exception.ApiException;
import com.connecthub.security.UserPrincipal;
import com.connecthub.service.ConversationService;
import com.connecthub.service.GlobalChatService;
import com.connecthub.service.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final GlobalChatService globalChatService;
    private final ConversationService conversationService;
    private final PresenceService presenceService;

    @MessageMapping("/global.send")
    public void sendGlobal(@Payload ChatDtos.SendMessageRequest request, Principal principal) {
        UserPrincipal user = UserPrincipal.require(principal);
        globalChatService.send(user.id(), request.content());
    }

    @MessageMapping("/private.send")
    public void sendPrivate(@Payload ChatDtos.SendPrivateRequest request, Principal principal) {
        UserPrincipal user = UserPrincipal.require(principal);
        conversationService.send(user.id(), request.conversationId(), request.content());
    }

    @MessageMapping("/presence.active")
    public void active(Principal principal) {
        presenceService.markActive(UserPrincipal.require(principal).id());
    }

    @MessageExceptionHandler(ApiException.class)
    @SendToUser("/queue/errors")
    public ApiError handleApi(ApiException ex) {
        return new ApiError(ex.getMessage());
    }

    @MessageExceptionHandler(Exception.class)
    @SendToUser("/queue/errors")
    public ApiError handleUnexpected(Exception ex) {
        return new ApiError("Message could not be delivered");
    }
}
