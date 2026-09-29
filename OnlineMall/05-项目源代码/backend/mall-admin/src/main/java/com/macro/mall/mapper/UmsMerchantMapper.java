package com.macro.mall.mapper;

import com.macro.mall.model.UmsMerchant;
import com.macro.mall.model.UmsMerchantExample;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface UmsMerchantMapper {
    long countByExample(UmsMerchantExample example);

    int deleteByExample(UmsMerchantExample example);

    int deleteByPrimaryKey(Long id);

    int insert(UmsMerchant row);

    int insertSelective(UmsMerchant row);

    List<UmsMerchant> selectByExample(UmsMerchantExample example);

    UmsMerchant selectByPrimaryKey(Long id);

    int updateByExampleSelective(@Param("row") UmsMerchant row, @Param("example") UmsMerchantExample example);

    int updateByExample(@Param("row") UmsMerchant row, @Param("example") UmsMerchantExample example);

    int updateByPrimaryKeySelective(UmsMerchant row);

    int updateByPrimaryKey(UmsMerchant row);
}
