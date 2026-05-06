package com.oblivion.exception;

import java.util.List;

import com.oblivion.validator.ValidationErrorDetail;

public class ValidationException extends RuntimeException {

    private final List<ValidationErrorDetail> validationErrors;

    public ValidationException(List<ValidationErrorDetail> validationErrors) {
        super("Validation failed.");
        this.validationErrors = List.copyOf(validationErrors);
    }

    public List<ValidationErrorDetail> validationErrors() {
        return validationErrors;
    }
}