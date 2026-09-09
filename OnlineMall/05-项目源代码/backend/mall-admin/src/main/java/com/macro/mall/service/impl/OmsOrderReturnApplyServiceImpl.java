package com.macro.mall.service.impl;

import com.github.pagehelper.PageHelper;
import com.macro.mall.constant.OmsOrderStatus;
import com.macro.mall.dao.OmsOrderReturnApplyDao;
import com.macro.mall.dto.OmsOrderReturnApplyResult;
import com.macro.mall.dto.OmsReturnApplyHandleParam;
import com.macro.mall.dto.OmsReturnApplyParam;
import com.macro.mall.dto.OmsReturnApplyQueryParam;
import com.macro.mall.dto.OmsUpdateStatusParam;
import com.macro.mall.mapper.OmsOrderItemMapper;
import com.macro.mall.mapper.OmsOrderMapper;
import com.macro.mall.mapper.OmsOrderOperateHistoryMapper;
import com.macro.mall.mapper.OmsOrderReturnApplyMapper;
import com.macro.mall.mapper.OmsReturnApplyImageMapper;
import com.macro.mall.model.OmsOrder;
import com.macro.mall.model.OmsOrderItem;
import com.macro.mall.model.OmsOrderItemExample;
import com.macro.mall.model.OmsOrderOperateHistory;
import com.macro.mall.model.OmsOrderReturnApply;
import com.macro.mall.model.OmsOrderReturnApplyExample;
import com.macro.mall.model.OmsReturnApplyImage;
import com.macro.mall.service.OmsOrderReturnApplyService;
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

    private static final Set<Integer> ALLOW_AFTER_SALE_STATUS = new HashSet<>(Arrays.asList(
            OmsOrderStatus.PAID.getValue(),
            OmsOrderStatus.PENDING_SHIPMENT.getValue(),
            OmsOrderStatus.SHIPPED.getValue(),
            OmsOrderStatus.RECEIVED.getValue()
    ));

    @Override
    public List<OmsOrderReturnApply> list(OmsReturnApplyQueryParam queryParam, Integer pageSize, Integer pageNum) {
        PageHelper.startPage(pageNum,pageSize);
        return returnApplyDao.getList(queryParam);
    }

    @Override
    public int delete(List<Long> ids) {
        OmsOrderReturnApplyExample example = new OmsOrderReturnApplyExample();
        example.createCriteria().andIdIn(ids).andStatusEqualTo(3);
        return returnApplyMapper.deleteByExample(example);
    }

    @Override
    public int updateStatus(Long id, OmsUpdateStatusParam statusParam) {
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
        Integer targetOrderStatus;
        String note;
        if (param.getStatus().equals(1)) {
            // 审核通过
            if (apply.getReturnType() != null && apply.getReturnType().equals(2)) {
                targetOrderStatus = OmsOrderStatus.CANCELLED.getValue();
                note = "售后审核通过：退款";
            } else {
                targetOrderStatus = OmsOrderStatus.COMPLETED.getValue();
                note = "售后审核通过：退货";
            }
        } else if (param.getStatus().equals(2)) {
            // 审核驳回，恢复原状态
            targetOrderStatus = apply.getPreStatus();
            note = "售后审核驳回";
        } else {
            throw new RuntimeException("不支持的审核状态");
        }
        // 更新售后申请
        int count = returnApplyDao.updateStatusById(apply.getId(), param.getStatus(), "后台管理员", param.getHandleRemark());
        // 更新订单状态
        updateOrderStatus(order.getId(), targetOrderStatus, note);
        return count;
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
        history.setOperateMan("后台管理员");
        history.setOrderStatus(status);
        history.setNote(note);
        orderOperateHistoryMapper.insert(history);
    }
}
