package com.oblivion.exception;

import java.util.List;

import com.oblivion.validator.ValidationErrorDetail;

import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class ValidationExceptionMapper implements ExceptionMapper<ValidationException> {

    @Override
    public Response toResponse(ValidationException exception) {
        List<ValidationErrorResponseDetail> details = exception.validationErrors().stream()
                .map(this::toResponseDetail)
                .toList();

        ValidationErrorResponse validationErrorResponse = new ValidationErrorResponse(
                "VALIDATION_FAILED",
                "Request validation failed.",
                details);

        return Response.status(Response.Status.BAD_REQUEST)
                .entity(validationErrorResponse)
                .type(MediaType.APPLICATION_JSON)
                .build();
    }

    private ValidationErrorResponseDetail toResponseDetail(ValidationErrorDetail validationErrorDetail) {
        return new ValidationErrorResponseDetail(
                validationErrorDetail.code(),
                validationErrorDetail.field(),
                validationErrorDetail.message());
    }

    public record ValidationErrorResponse(
            String error,
            String message,
            List<ValidationErrorResponseDetail> details) {
    }

    public record ValidationErrorResponseDetail(
            String code,
            String field,
            String message) {
    }
}