package com.partyvibe.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GiftDto {
    private Long id;
    private String name;
    private String icon;
    private long coinPrice;
    private String animationType;
    private String soundEffect;
}
