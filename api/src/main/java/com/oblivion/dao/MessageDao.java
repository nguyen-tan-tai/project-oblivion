package com.oblivion.dao;

import com.oblivion.entity.MessageRecord;

public interface MessageDao {

    void saveMessage(MessageRecord messageRecord);

    MessageRecord retrieveAndForgetMessage(String messageId);
}