package com.oblivion.validator;

public enum MessageValidationErrorDetail implements ValidationErrorDetail {
    PAYLOAD_REQUIRED("VAL-001", "payload", "Payload is required."),
    MESSAGE_REQUIRED("VAL-002", "message", "message is required."),
    EXPIRE_TIME_INVALID("VAL-003", "expireTime", "expireTime must be a timestamp.");

    private final String code;
    private final String field;
    private final String message;

    MessageValidationErrorDetail(String code, String field, String message) {
        this.code = code;
        this.field = field;
        this.message = message;
    }

    @Override
    public String code() {
        return code;
    }

    @Override
    public String field() {
        return field;
    }

    @Override
    public String message() {
        return message;
    }
}