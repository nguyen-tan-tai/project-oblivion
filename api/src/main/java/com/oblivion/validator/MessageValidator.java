package com.oblivion.validator;

import java.util.ArrayList;
import java.util.List;

import com.oblivion.dto.CreateMessageInput;
import com.oblivion.exception.ValidationException;

import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class MessageValidator {

    public void validateCreatePayloadOrThrow(CreateMessageInput createMessageInput) {
        List<ValidationErrorDetail> validationErrors = validateCreatePayload(createMessageInput);
        if (!validationErrors.isEmpty()) {
            throw new ValidationException(validationErrors);
        }
    }

    public List<ValidationErrorDetail> validateCreatePayload(CreateMessageInput createMessageInput) {
        List<ValidationErrorDetail> validationErrors = new ArrayList<>();

        if (createMessageInput == null) {
            validationErrors.add(MessageValidationErrorDetail.PAYLOAD_REQUIRED);
            return validationErrors;
        }

        if (createMessageInput.message() == null || createMessageInput.message().isBlank()) {
            validationErrors.add(MessageValidationErrorDetail.MESSAGE_REQUIRED);
        }

        return validationErrors;
    }

}