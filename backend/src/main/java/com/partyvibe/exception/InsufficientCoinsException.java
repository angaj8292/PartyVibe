package com.partyvibe.exception;

import org.springframework.http.HttpStatus;

public class InsufficientCoinsException extends ApiException {
    public InsufficientCoinsException(String message) {
        super(message, HttpStatus.PAYMENT_REQUIRED);
    }
}
