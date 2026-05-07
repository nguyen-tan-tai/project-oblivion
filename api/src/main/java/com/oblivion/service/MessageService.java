package com.oblivion.service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import com.oblivion.dao.MessageDao;
import com.oblivion.dto.CreateMessageInput;
import com.oblivion.entity.MessageRecord;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.NotFoundException;

@ApplicationScoped
public class MessageService {

    @Inject
    MessageDao messageDao;

    public Map<String, String> create(CreateMessageInput createMessageInput) {
        System.out.println("Received create input: " + createMessageInput);

        String messageId = UUID.randomUUID().toString();
        long createdAt = Instant.now().toEpochMilli();

        messageDao.saveMessage(new MessageRecord(
                messageId,
                createMessageInput.message(),
                createMessageInput.expireTime(),
                createdAt));

        return Map.of("message_id", messageId);
    }

    public Map<String, Object> retrieveAndForget(String id) {
        MessageRecord messageRecord = messageDao.retrieveAndForgetMessage(id);
        if (messageRecord == null) {
            throw new NotFoundException("Message not found.");
        }

        System.out.println("Retrieved message record: " + messageRecord);

        return Map.of(
                "id", id,
                "message", messageRecord.message(),
                "createdAt", messageRecord.createdAt(),
                "expireTime", messageRecord.expireTime());
    }
}