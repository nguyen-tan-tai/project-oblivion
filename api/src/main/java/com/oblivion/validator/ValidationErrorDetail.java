package com.oblivion.validator;

public interface ValidationErrorDetail {

    String code();

    String field();

    String message();
}