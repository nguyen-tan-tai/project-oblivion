package com.oblivion.dto;

public record CreateMessageInput(String message, Long expireTime) {
}