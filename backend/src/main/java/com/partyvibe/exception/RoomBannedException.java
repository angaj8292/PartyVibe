package com.partyvibe.exception;

import org.springframework.http.HttpStatus;

public class RoomBannedException extends ApiException {
    public RoomBannedException(String message) {
        super(message, HttpStatus.FORBIDDEN);
    }
}
