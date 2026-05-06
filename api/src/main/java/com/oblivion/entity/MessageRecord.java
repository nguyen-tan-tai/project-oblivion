package com.oblivion.entity;

public record MessageRecord(
        String messageId,
        String message,
        Long expireTime,
        long createdAt) {
}