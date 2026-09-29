package com.macro.mall.portal.service.impl;

import com.github.pagehelper.PageHelper;
import com.macro.mall.common.api.CommonPage;
import com.macro.mall.common.exception.ApiException;
import com.macro.mall.constant.OmsOrderStatus;
import com.macro.mall.mapper.OmsOrderItemMapper;
import com.macro.mall.mapper.OmsOrderMapper;
import com.macro.mall.mapper.OmsOrderOperateHistoryMapper;
import com.macro.mall.mapper.OmsOrderReturnApplyMapper;
import com.macro.mall.model.OmsOrder;
import com.macro.mall.model.OmsOrderItem;
import com.macro.mall.model.OmsOrderItemExample;
import com.macro.mall.model.OmsOrderOperateHistory;
import com.macro.mall.model.OmsOrderReturnApply;
import com.macro.mall.model.OmsOrderReturnApplyExample;
import com.macro.mall.model.UmsMember;
import com.macro.mall.portal.domain.OmsOrderReturnApplyParam;
import com.macro.mall.portal.service.OmsPortalOrderReturnApplyService;
import com.macro.mall.portal.service.UmsMemberService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * 订单退货管理Service实现类
 * Created by macro on 2018/10/17.
 */
@Service
public class OmsPortalOrderReturnApplyServiceImpl implements OmsPortalOrderReturnApplyService {
    /**
     * 允许发起售后的订单状态：已支付/待发货/已发货/已收货/已完成
     */
    private static final Set<Integer> ALLOW_AFTER_SALE_STATUS = new HashSet<>(Arrays.asList(
            OmsOrderStatus.PAID.getValue(),
            OmsOrderStatus.PENDING_SHIPMENT.getValue(),
            OmsOrderStatus.SHIPPED.getValue(),
            OmsOrderStatus.RECEIVED.getValue(),
            OmsOrderStatus.COMPLETED.getValue()
    ));

    @Autowired
    private OmsOrderReturnApplyMapper returnApplyMapper;
    @Autowired
    private OmsOrderMapper orderMapper;
    @Autowired
    private OmsOrderItemMapper orderItemMapper;
    @Autowired
    private OmsOrderOperateHistoryMapper orderOperateHistoryMapper;
    @Autowired
    private UmsMemberService memberService;

    @Override
    @Transactional
    public int create(OmsOrderReturnApplyParam returnApply) {
        UmsMember currentMember = memberService.getCurrentMember();
        OmsOrder order = orderMapper.selectByPrimaryKey(returnApply.getOrderId());
        if (order == null) {
            throw new ApiException("订单不存在");
        }
        //只能对自己的订单发起售后
        if (!order.getMemberId().equals(currentMember.getId())) {
            throw new ApiException("只能对自己的订单发起售后");
        }
        if (!ALLOW_AFTER_SALE_STATUS.contains(order.getStatus())) {
            throw new ApiException("当前订单状态不允许发起售后");
        }
        //防止重复提交
        OmsOrderReturnApplyExample existExample = new OmsOrderReturnApplyExample();
        existExample.createCriteria().andOrderIdEqualTo(order.getId()).andStatusIn(Arrays.asList(0, 1));
        if (returnApplyMapper.countByExample(existExample) > 0) {
            throw new ApiException("该订单已有进行中的售后申请");
        }
        OmsOrderReturnApply realApply = new OmsOrderReturnApply();
        BeanUtils.copyProperties(returnApply, realApply);
        realApply.setId(null);
        realApply.setCreateTime(new Date());
        realApply.setStatus(0);
        //关键信息以订单为准，不信任请求体
        realApply.setOrderSn(order.getOrderSn());
        realApply.setMemberUsername(currentMember.getUsername());
        realApply.setPreStatus(order.getStatus());
        if (realApply.getReturnType() == null) {
            realApply.setReturnType(1);
        }
        //金额与数量以订单明细为准，防止客户端篡改退款金额
        OmsOrderItemExample itemExample = new OmsOrderItemExample();
        itemExample.createCriteria().andOrderIdEqualTo(order.getId())
                .andProductIdEqualTo(returnApply.getProductId());
        List<OmsOrderItem> itemList = orderItemMapper.selectByExample(itemExample);
        OmsOrderItem matchedItem = itemList.stream()
                .filter(it -> returnApply.getProductAttr() == null || returnApply.getProductAttr().equals(it.getProductAttr()))
                .findFirst()
                .orElse(itemList.isEmpty() ? null : itemList.get(0));
        if (matchedItem == null) {
            throw new ApiException("售后商品不在该订单中");
        }
        Integer returnCount = returnApply.getProductCount();
        if (returnCount == null || returnCount < 1 || returnCount > matchedItem.getProductQuantity()) {
            throw new ApiException("退货数量不合法");
        }
        realApply.setProductCount(returnCount);
        realApply.setProductPrice(matchedItem.getProductPrice());
        //realAmount为优惠后单价（单件），退款金额=单价×数量
        realApply.setProductRealPrice(matchedItem.getRealAmount() != null
                ? matchedItem.getRealAmount() : matchedItem.getProductPrice());
        realApply.setProductPic(matchedItem.getProductPic());
        realApply.setProductName(matchedItem.getProductName());
        realApply.setProductBrand(matchedItem.getProductBrand());
        realApply.setProductAttr(matchedItem.getProductAttr());
        int count = returnApplyMapper.insert(realApply);
        //订单进入售后中
        OmsOrder update = new OmsOrder();
        update.setId(order.getId());
        update.setStatus(OmsOrderStatus.AFTER_SALE.getValue());
        update.setModifyTime(new Date());
        orderMapper.updateByPrimaryKeySelective(update);
        //操作记录
        OmsOrderOperateHistory history = new OmsOrderOperateHistory();
        history.setOrderId(order.getId());
        history.setCreateTime(new Date());
        history.setOperateMan(currentMember.getUsername());
        history.setOrderStatus(OmsOrderStatus.AFTER_SALE.getValue());
        history.setNote("发起售后申请");
        orderOperateHistoryMapper.insert(history);
        return count;
    }

    @Override
    public CommonPage<OmsOrderReturnApply> list(Integer pageSize, Integer pageNum) {
        UmsMember currentMember = memberService.getCurrentMember();
        PageHelper.startPage(pageNum, pageSize);
        OmsOrderReturnApplyExample example = new OmsOrderReturnApplyExample();
        example.createCriteria().andMemberUsernameEqualTo(currentMember.getUsername());
        example.setOrderByClause("create_time desc");
        List<OmsOrderReturnApply> list = returnApplyMapper.selectByExample(example);
        return CommonPage.restPage(list);
    }

    @Override
    public OmsOrderReturnApply detail(Long id) {
        UmsMember currentMember = memberService.getCurrentMember();
        OmsOrderReturnApply apply = returnApplyMapper.selectByPrimaryKey(id);
        if (apply == null || !currentMember.getUsername().equals(apply.getMemberUsername())) {
            throw new ApiException("售后申请不存在");
        }
        return apply;
    }
}
