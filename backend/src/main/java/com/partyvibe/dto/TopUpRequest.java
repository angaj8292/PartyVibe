package com.partyvibe.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopUpRequest {

    @NotNull(message = "Amount is required")
    @Min(value = 1, message = "Amount must be at least 1 coin")
    private Long amount;

    private String paymentMethod; // e.g. "UPI", "CARD", "NETBANKING", "RAZORPAY", "TEST"
    private String paymentReference;
    private Double price;
    private String currency; // "INR", "USD"
}
