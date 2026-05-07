package com.oblivion.controller;

import java.util.Map;

import com.oblivion.dto.CreateMessageInput;
import com.oblivion.service.MessageService;
import com.oblivion.validator.MessageValidator;

import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/message")
@Produces(MediaType.APPLICATION_JSON)
public class MessageController {

    @Inject
    MessageService messageService;

    @Inject
    MessageValidator messageValidator;

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    public Map<String, String> create(CreateMessageInput createMessageInput) {
        messageValidator.validateCreatePayloadOrThrow(createMessageInput);
        return messageService.create(createMessageInput);
    }

    @POST
    @Path("/{messageId}")
    @Consumes(MediaType.APPLICATION_JSON)
    public Map<String, Object> retrieveAndForget(
            @PathParam("messageId") String id) {
        return messageService.retrieveAndForget(id);
    }
}