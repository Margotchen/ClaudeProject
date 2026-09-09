package com.macro.mall.dao;

import com.macro.mall.dto.OmsOrderReturnApplyResult;
import com.macro.mall.dto.OmsReturnApplyQueryParam;
import com.macro.mall.model.OmsOrderReturnApply;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 订单退货申请管理自定义Dao
 * Created by macro on 2018/10/18.
 */
public interface OmsOrderReturnApplyDao {
    /**
     * 查询申请列表
     */
    List<OmsOrderReturnApply> getList(@Param("queryParam") OmsReturnApplyQueryParam queryParam);

    /**
     * 获取申请详情
     */
    OmsOrderReturnApplyResult getDetail(@Param("id")Long id);

    /**
     * 插入售后申请（包含售后类型）
     */
    int insertReturnApply(@Param("apply") OmsOrderReturnApply apply);

    /**
     * 根据主键更新售后申请状态与处理意见
     */
    int updateStatusById(@Param("id") Long id,
                         @Param("status") Integer status,
                         @Param("handleMan") String handleMan,
                         @Param("handleRemark") String handleRemark);
}
