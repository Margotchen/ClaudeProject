package com.macro.mall.service.impl;

import cn.hutool.core.util.StrUtil;
import com.github.pagehelper.PageHelper;
import com.macro.mall.dto.UmsMerchantParam;
import com.macro.mall.mapper.UmsMerchantMapper;
import com.macro.mall.model.UmsMerchant;
import com.macro.mall.model.UmsMerchantExample;
import com.macro.mall.service.UmsMerchantService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
public class UmsMerchantServiceImpl implements UmsMerchantService {
    @Autowired
    private UmsMerchantMapper merchantMapper;

    @Override
    public int create(UmsMerchantParam param) {
        UmsMerchant merchant = new UmsMerchant();
        BeanUtils.copyProperties(param, merchant);
        merchant.setCreateTime(new Date());
        merchant.setUpdateTime(new Date());
        return merchantMapper.insertSelective(merchant);
    }

    @Override
    public int update(Long id, UmsMerchantParam param) {
        UmsMerchant merchant = new UmsMerchant();
        BeanUtils.copyProperties(param, merchant);
        merchant.setId(id);
        merchant.setUpdateTime(new Date());
        return merchantMapper.updateByPrimaryKeySelective(merchant);
    }

    @Override
    public int delete(Long id) {
        return merchantMapper.deleteByPrimaryKey(id);
    }

    @Override
    public List<UmsMerchant> list(String keyword, Integer pageSize, Integer pageNum) {
        PageHelper.startPage(pageNum, pageSize);
        UmsMerchantExample example = new UmsMerchantExample();
        if (StrUtil.isNotEmpty(keyword)) {
            example.createCriteria().andShopNameLike("%" + keyword + "%");
        }
        return merchantMapper.selectByExample(example);
    }

    @Override
    public UmsMerchant getItem(Long id) {
        return merchantMapper.selectByPrimaryKey(id);
    }
}
