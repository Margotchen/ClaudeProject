package com.macro.mall.service;

import com.macro.mall.dto.UmsMerchantParam;
import com.macro.mall.model.UmsMerchant;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface UmsMerchantService {
    @Transactional
    int create(UmsMerchantParam param);

    int update(Long id, UmsMerchantParam param);

    int delete(Long id);

    List<UmsMerchant> list(String keyword, Integer pageSize, Integer pageNum);

    UmsMerchant getItem(Long id);
}
