package com.macro.mall.dao;

import com.macro.mall.model.PmsSkuStock;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 商品SKU管理自定义Dao
 * Created by macro on 2018/4/26.
 */
public interface PmsSkuStockDao {
    /**
     * 批量插入操作
     */
    int insertList(@Param("list")List<PmsSkuStock> skuStockList);

    /**
     * 批量插入或替换操作
     */
    int replaceList(@Param("list")List<PmsSkuStock> skuStockList);

    /**
     * 回补实际库存（售后退货用）
     */
    int restoreStock(@Param("skuId") Long skuId, @Param("quantity") Integer quantity);

    /**
     * 释放锁定库存（关闭未支付订单用）
     */
    int releaseLockStock(@Param("skuId") Long skuId, @Param("quantity") Integer quantity);
}
