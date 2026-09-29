package com.macro.mall.portal.service;

import com.macro.mall.common.api.CommonPage;
import com.macro.mall.model.OmsOrderReturnApply;
import com.macro.mall.portal.domain.OmsOrderReturnApplyParam;

/**
 * 前台订单退货管理Service
 * Created by macro on 2018/10/17.
 */
public interface OmsPortalOrderReturnApplyService {
    /**
     * 提交申请
     */
    int create(OmsOrderReturnApplyParam returnApply);

    /**
     * 当前会员的售后申请列表
     */
    CommonPage<OmsOrderReturnApply> list(Integer pageSize, Integer pageNum);

    /**
     * 售后申请详情（仅本人可见）
     */
    OmsOrderReturnApply detail(Long id);
}
