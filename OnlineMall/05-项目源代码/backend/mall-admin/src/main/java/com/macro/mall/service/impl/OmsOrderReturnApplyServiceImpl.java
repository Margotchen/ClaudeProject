package com.macro.mall.service.impl;

import com.github.pagehelper.PageHelper;
import com.macro.mall.constant.OmsOrderStatus;
import com.macro.mall.dao.OmsOrderReturnApplyDao;
import com.macro.mall.dao.PmsSkuStockDao;
import com.macro.mall.dto.OmsOrderReturnApplyResult;
import com.macro.mall.dto.OmsReturnApplyHandleParam;
import com.macro.mall.dto.OmsReturnApplyParam;
import com.macro.mall.dto.OmsReturnApplyQueryParam;
import com.macro.mall.dto.OmsUpdateStatusParam;
import com.macro.mall.mapper.OmsOrderItemMapper;
import com.macro.mall.mapper.OmsOrderLogisticsTraceMapper;
import com.macro.mall.mapper.OmsOrderMapper;
import com.macro.mall.mapper.OmsOrderOperateHistoryMapper;
import com.macro.mall.mapper.OmsOrderReturnApplyMapper;
import com.macro.mall.mapper.OmsReturnApplyImageMapper;
import com.macro.mall.mapper.SmsCouponHistoryMapper;
import com.macro.mall.mapper.UmsMemberMapper;
import com.macro.mall.model.OmsOrder;
import com.macro.mall.model.OmsOrderItem;
import com.macro.mall.model.OmsOrderItemExample;
import com.macro.mall.model.OmsOrderLogisticsTrace;
import com.macro.mall.model.OmsOrderOperateHistory;
import com.macro.mall.model.OmsOrderReturnApply;
import com.macro.mall.model.OmsOrderReturnApplyExample;
import com.macro.mall.model.OmsReturnApplyImage;
import com.macro.mall.model.SmsCouponHistory;
import com.macro.mall.model.SmsCouponHistoryExample;
import com.macro.mall.model.UmsMember;
import com.macro.mall.service.OmsOrderReturnApplyService;
import com.macro.mall.util.CurrentMerchantUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 订单退货管理Service实现类
 * Created by macro on 2018/10/18.
 */
@Service
public class OmsOrderReturnApplyServiceImpl implements OmsOrderReturnApplyService {
    @Autowired
    private OmsOrderReturnApplyDao returnApplyDao;
    @Autowired
    private OmsOrderReturnApplyMapper returnApplyMapper;
    @Autowired
    private OmsOrderMapper orderMapper;
    @Autowired
    private OmsOrderItemMapper orderItemMapper;
    @Autowired
    private OmsReturnApplyImageMapper returnApplyImageMapper;
    @Autowired
    private OmsOrderOperateHistoryMapper orderOperateHistoryMapper;
    @Autowired
    private PmsSkuStockDao skuStockDao;
    @Autowired
    private OmsOrderLogisticsTraceMapper logisticsTraceMapper;
    @Autowired
    private SmsCouponHistoryMapper couponHistoryMapper;
    @Autowired
    private UmsMemberMapper memberMapper;

    private static final Set<Integer> ALLOW_AFTER_SALE_STATUS = new HashSet<>(Arrays.asList(
            OmsOrderStatus.PAID.getValue(),
            OmsOrderStatus.PENDING_SHIPMENT.getValue(),
            OmsOrderStatus.SHIPPED.getValue(),
            OmsOrderStatus.RECEIVED.getValue()
    ));

    @Override
    public List<OmsOrderReturnApply> list(OmsReturnApplyQueryParam queryParam, Integer pageSize, Integer pageNum) {
        PageHelper.startPage(pageNum,pageSize);
        Long shopId = CurrentMerchantUtil.getCurrentShopId();
        return returnApplyDao.getList(queryParam, shopId);
    }

    /**
     * 校验售后申请归属当前店铺；平台管理员放行
     */
    private void checkApplyShop(Long applyId) {
        OmsOrderReturnApply apply = returnApplyMapper.selectByPrimaryKey(applyId);
        if (apply == null) {
            throw new RuntimeException("售后申请不存在");
        }
        OmsOrder order = orderMapper.selectByPrimaryKey(apply.getOrderId());
        if (order != null) {
            CurrentMerchantUtil.checkShop(order.getShopId());
        }
    }

    @Override
    public int delete(List<Long> ids) {
        for (Long id : ids) {
            checkApplyShop(id);
        }
        OmsOrderReturnApplyExample example = new OmsOrderReturnApplyExample();
        example.createCriteria().andIdIn(ids).andStatusEqualTo(3);
        return returnApplyMapper.deleteByExample(example);
    }

    @Override
    public int updateStatus(Long id, OmsUpdateStatusParam statusParam) {
        checkApplyShop(id);
        Integer status = statusParam.getStatus();
        OmsOrderReturnApply returnApply = new OmsOrderReturnApply();
        if(status.equals(1)){
            //确认退货
            returnApply.setId(id);
            returnApply.setStatus(1);
            returnApply.setReturnAmount(statusParam.getReturnAmount());
            returnApply.setCompanyAddressId(statusParam.getCompanyAddressId());
            returnApply.setHandleTime(new Date());
            returnApply.setHandleMan(statusParam.getHandleMan());
            returnApply.setHandleNote(statusParam.getHandleNote());
        }else if(status.equals(2)){
            //完成退货
            returnApply.setId(id);
            returnApply.setStatus(2);
            returnApply.setReceiveTime(new Date());
            returnApply.setReceiveMan(statusParam.getReceiveMan());
            returnApply.setReceiveNote(statusParam.getReceiveNote());
        }else if(status.equals(3)){
            //拒绝退货
            returnApply.setId(id);
            returnApply.setStatus(3);
            returnApply.setHandleTime(new Date());
            returnApply.setHandleMan(statusParam.getHandleMan());
            returnApply.setHandleNote(statusParam.getHandleNote());
        }else{
            return 0;
        }
        return returnApplyMapper.updateByPrimaryKeySelective(returnApply);
    }

    @Override
    public OmsOrderReturnApplyResult getItem(Long id) {
        checkApplyShop(id);
        return returnApplyDao.getDetail(id);
    }

    @Override
    @Transactional
    public int create(OmsReturnApplyParam param) {
        OmsOrder order = orderMapper.selectByPrimaryKey(param.getOrderId());
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }
        if (!ALLOW_AFTER_SALE_STATUS.contains(order.getStatus())) {
            throw new RuntimeException("当前订单状态不允许发起售后");
        }
        OmsOrderItemExample example = new OmsOrderItemExample();
        example.createCriteria().andOrderIdEqualTo(order.getId());
        List<OmsOrderItem> itemList = orderItemMapper.selectByExample(example);
        if (CollectionUtils.isEmpty(itemList)) {
            throw new RuntimeException("订单商品信息为空");
        }
        OmsOrderItem item = itemList.get(0);
        OmsOrderReturnApply apply = new OmsOrderReturnApply();
        apply.setOrderId(order.getId());
        apply.setOrderSn(order.getOrderSn());
        apply.setMemberUsername(order.getMemberUsername());
        apply.setReturnAmount(order.getPayAmount());
        apply.setProductCount(item.getProductQuantity());
        apply.setProductPrice(item.getProductPrice());
        apply.setProductRealPrice(item.getProductPrice());
        apply.setProductId(item.getProductId());
        apply.setProductPic(item.getProductPic());
        apply.setProductName(item.getProductName());
        apply.setProductBrand(item.getProductBrand());
        apply.setProductAttr(item.getProductAttr());
        apply.setReason(param.getReason());
        apply.setDescription(param.getDescription());
        apply.setReturnType(param.getReturnType());
        apply.setPreStatus(order.getStatus());
        if (!CollectionUtils.isEmpty(param.getProofImages())) {
            apply.setProofPics(String.join(",", param.getProofImages()));
        }
        int count = returnApplyDao.insertReturnApply(apply);
        // 保存凭证图片
        if (!CollectionUtils.isEmpty(param.getProofImages())) {
            for (String url : param.getProofImages()) {
                OmsReturnApplyImage image = new OmsReturnApplyImage();
                image.setApplyId(apply.getId());
                image.setUrl(url);
                returnApplyImageMapper.insert(image);
            }
        }
        // 更新订单状态为售后中
        updateOrderStatus(order.getId(), OmsOrderStatus.AFTER_SALE.getValue(), "发起售后申请");
        return count;
    }

    @Override
    @Transactional
    public int handle(OmsReturnApplyHandleParam param) {
        OmsOrderReturnApply apply = returnApplyMapper.selectByPrimaryKey(param.getApplyId());
        if (apply == null) {
            throw new RuntimeException("售后申请不存在");
        }
        OmsOrder order = orderMapper.selectByPrimaryKey(apply.getOrderId());
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }
        CurrentMerchantUtil.checkShop(order.getShopId());
        boolean approved = param.getStatus().equals(1);
        boolean refundOnly = apply.getReturnType() != null && apply.getReturnType().equals(2);
        Integer targetOrderStatus;
        Integer applyStatus;
        String note;
        if (approved) {
            // 审核通过：申请单状态 1=退货中(退货) 2=已完成(仅退款)
            if (refundOnly) {
                targetOrderStatus = OmsOrderStatus.CANCELLED.getValue();
                applyStatus = 2;
                note = "售后审核通过：退款";
            } else {
                targetOrderStatus = OmsOrderStatus.COMPLETED.getValue();
                applyStatus = 1;
                note = "售后审核通过：退货";
            }
        } else if (param.getStatus().equals(2)) {
            // 审核驳回，恢复原状态（旧数据 preStatus 可能为空，兜底为已收货）
            targetOrderStatus = apply.getPreStatus() != null ? apply.getPreStatus() : OmsOrderStatus.RECEIVED.getValue();
            applyStatus = 3;
            note = "售后审核驳回";
        } else {
            throw new RuntimeException("不支持的审核状态");
        }
        // 更新售后申请
        int count = returnApplyDao.updateStatusById(apply.getId(), applyStatus, CurrentMerchantUtil.getCurrentUsername(), param.getHandleRemark());
        BigDecimal returnAmount = null;
        if (approved) {
            // 退款金额落库
            returnAmount = calcReturnAmount(apply, order);
            OmsOrderReturnApply updateApply = new OmsOrderReturnApply();
            updateApply.setId(apply.getId());
            updateApply.setReturnAmount(returnAmount);
            returnApplyMapper.updateByPrimaryKeySelective(updateApply);
            // 退货退款才回补库存；仅退款商品未退回，不回补
            if (!refundOnly) {
                restoreStock(apply);
            }
            // 返还优惠券与积分
            returnCouponAndIntegration(order);
        }
        // 更新订单状态
        updateOrderStatus(order.getId(), targetOrderStatus, note);
        // 写售后物流轨迹
        OmsOrderLogisticsTrace trace = new OmsOrderLogisticsTrace();
        trace.setOrderId(order.getId());
        trace.setCreateTime(new Date());
        trace.setContent(approved
                ? note + "，退款金额 ¥" + returnAmount
                : note + (param.getHandleRemark() != null ? "：" + param.getHandleRemark() : ""));
        logisticsTraceMapper.insert(trace);
        return count;
    }

    /**
     * 计算退款金额：优先商品实付单价×数量，其次商品单价×数量，兜底订单实付金额
     */
    private BigDecimal calcReturnAmount(OmsOrderReturnApply apply, OmsOrder order) {
        if (apply.getProductRealPrice() != null && apply.getProductCount() != null) {
            return apply.getProductRealPrice().multiply(new BigDecimal(apply.getProductCount()));
        }
        if (apply.getProductPrice() != null && apply.getProductCount() != null) {
            return apply.getProductPrice().multiply(new BigDecimal(apply.getProductCount()));
        }
        return order.getPayAmount();
    }

    /**
     * 回补售后商品的 SKU 库存
     */
    private void restoreStock(OmsOrderReturnApply apply) {
        OmsOrderItemExample example = new OmsOrderItemExample();
        example.createCriteria().andOrderIdEqualTo(apply.getOrderId()).andProductIdEqualTo(apply.getProductId());
        List<OmsOrderItem> items = orderItemMapper.selectByExample(example);
        if (CollectionUtils.isEmpty(items)) {
            return;
        }
        //同一商品可能存在多个SKU，按规格属性精确匹配，避免回补错SKU
        OmsOrderItem item = items.stream()
                .filter(it -> apply.getProductAttr() == null || apply.getProductAttr().equals(it.getProductAttr()))
                .findFirst()
                .orElse(items.get(0));
        Integer quantity = apply.getProductCount() != null ? apply.getProductCount() : item.getProductQuantity();
        if (item.getProductSkuId() != null && quantity != null) {
            skuStockDao.restoreStock(item.getProductSkuId(), quantity);
        }
    }

    /**
     * 售后通过时返还优惠券与积分（对齐 portal 取消订单的回退逻辑）
     */
    private void returnCouponAndIntegration(OmsOrder order) {
        if (order.getCouponId() != null) {
            SmsCouponHistoryExample example = new SmsCouponHistoryExample();
            example.createCriteria().andMemberIdEqualTo(order.getMemberId())
                    .andCouponIdEqualTo(order.getCouponId()).andUseStatusEqualTo(1);
            List<SmsCouponHistory> historyList = couponHistoryMapper.selectByExample(example);
            if (!CollectionUtils.isEmpty(historyList)) {
                SmsCouponHistory history = historyList.get(0);
                history.setUseStatus(0);
                history.setUseTime(null);
                couponHistoryMapper.updateByPrimaryKeySelective(history);
            }
        }
        if (order.getUseIntegration() != null && order.getUseIntegration() > 0) {
            UmsMember member = memberMapper.selectByPrimaryKey(order.getMemberId());
            if (member != null) {
                UmsMember update = new UmsMember();
                update.setId(member.getId());
                update.setIntegration(member.getIntegration() + order.getUseIntegration());
                memberMapper.updateByPrimaryKeySelective(update);
            }
        }
    }

    private void updateOrderStatus(Long orderId, Integer status, String note) {
        OmsOrder update = new OmsOrder();
        update.setId(orderId);
        update.setStatus(status);
        update.setModifyTime(new Date());
        orderMapper.updateByPrimaryKeySelective(update);
        OmsOrderOperateHistory history = new OmsOrderOperateHistory();
        history.setOrderId(orderId);
        history.setCreateTime(new Date());
        history.setOperateMan(CurrentMerchantUtil.getCurrentUsername());
        history.setOrderStatus(status);
        history.setNote(note);
        orderOperateHistoryMapper.insert(history);
    }
}
