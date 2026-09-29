package com.macro.mall.service.impl;

import com.github.pagehelper.PageHelper;
import com.macro.mall.dao.OmsOrderDao;
import com.macro.mall.dao.OmsOrderOperateHistoryDao;
import com.macro.mall.dao.PmsSkuStockDao;
import com.macro.mall.dto.*;
import com.macro.mall.mapper.OmsOrderItemMapper;
import com.macro.mall.mapper.OmsOrderLogisticsTraceMapper;
import com.macro.mall.mapper.OmsOrderMapper;
import com.macro.mall.mapper.OmsOrderOperateHistoryMapper;
import com.macro.mall.constant.OmsOrderStatus;
import com.macro.mall.model.OmsOrder;
import com.macro.mall.model.OmsOrderExample;
import com.macro.mall.model.OmsOrderItem;
import com.macro.mall.model.OmsOrderItemExample;
import com.macro.mall.model.OmsOrderLogisticsTrace;
import com.macro.mall.model.OmsOrderOperateHistory;
import com.macro.mall.service.OmsOrderService;
import com.macro.mall.util.CurrentMerchantUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 订单管理Service实现类
 * Created by macro on 2018/10/11.
 */
@Service
public class OmsOrderServiceImpl implements OmsOrderService {
    @Autowired
    private OmsOrderMapper orderMapper;
    @Autowired
    private OmsOrderDao orderDao;
    @Autowired
    private OmsOrderOperateHistoryDao orderOperateHistoryDao;
    @Autowired
    private OmsOrderOperateHistoryMapper orderOperateHistoryMapper;
    @Autowired
    private OmsOrderLogisticsTraceMapper orderLogisticsTraceMapper;
    @Autowired
    private OmsOrderItemMapper orderItemMapper;
    @Autowired
    private PmsSkuStockDao skuStockDao;

    @Override
    public List<OmsOrder> list(OmsOrderQueryParam queryParam, Integer pageSize, Integer pageNum) {
        PageHelper.startPage(pageNum, pageSize);
        Long shopId = CurrentMerchantUtil.getCurrentShopId();
        return orderDao.getList(queryParam, shopId);
    }

    @Override
    public int delivery(List<OmsOrderDeliveryParam> deliveryParamList) {
        //批量发货，仅允许待发货订单发货
        for (OmsOrderDeliveryParam param : deliveryParamList) {
            OmsOrder order = orderMapper.selectByPrimaryKey(param.getOrderId());
            if (order == null || !OmsOrderStatus.PENDING_SHIPMENT.getValue().equals(order.getStatus())) {
                throw new RuntimeException("订单不存在或不是待发货状态，无法发货");
            }
            CurrentMerchantUtil.checkShop(order.getShopId());
        }
        int count = orderDao.delivery(deliveryParamList);
        //添加操作记录
        List<OmsOrderOperateHistory> operateHistoryList = deliveryParamList.stream()
                .map(omsOrderDeliveryParam -> {
                    OmsOrderOperateHistory history = new OmsOrderOperateHistory();
                    history.setOrderId(omsOrderDeliveryParam.getOrderId());
                    history.setCreateTime(new Date());
                    history.setOperateMan(CurrentMerchantUtil.getCurrentUsername());
                    history.setOrderStatus(OmsOrderStatus.SHIPPED.getValue());
                    history.setNote("完成发货");
                    return history;
                }).collect(Collectors.toList());
        orderOperateHistoryDao.insertList(operateHistoryList);
        //添加模拟物流轨迹
        for (OmsOrderDeliveryParam param : deliveryParamList) {
            OmsOrderLogisticsTrace trace = new OmsOrderLogisticsTrace();
            trace.setOrderId(param.getOrderId());
            trace.setCreateTime(new Date());
            trace.setContent("商家已发货，物流公司：" + param.getDeliveryCompany() + "，运单号：" + param.getDeliverySn());
            orderLogisticsTraceMapper.insert(trace);
        }
        return count;
    }

    @Override
    @Transactional
    public int close(List<Long> ids, String note) {
        //仅允许关闭待支付订单
        OmsOrderExample checkExample = new OmsOrderExample();
        checkExample.createCriteria().andIdIn(ids);
        List<OmsOrder> orders = orderMapper.selectByExample(checkExample);
        for (OmsOrder order : orders) {
            if (!OmsOrderStatus.UNPAID.getValue().equals(order.getStatus())) {
                throw new RuntimeException("只能关闭待支付订单");
            }
            CurrentMerchantUtil.checkShop(order.getShopId());
        }
        //释放锁定库存
        for (OmsOrder order : orders) {
            OmsOrderItemExample itemExample = new OmsOrderItemExample();
            itemExample.createCriteria().andOrderIdEqualTo(order.getId());
            List<OmsOrderItem> itemList = orderItemMapper.selectByExample(itemExample);
            for (OmsOrderItem item : itemList) {
                if (item.getProductSkuId() != null && item.getProductQuantity() != null) {
                    skuStockDao.releaseLockStock(item.getProductSkuId(), item.getProductQuantity());
                }
            }
        }
        OmsOrder record = new OmsOrder();
        record.setStatus(OmsOrderStatus.CANCELLED.getValue());
        OmsOrderExample example = new OmsOrderExample();
        example.createCriteria().andDeleteStatusEqualTo(0).andIdIn(ids);
        int count = orderMapper.updateByExampleSelective(record, example);
        List<OmsOrderOperateHistory> historyList = ids.stream().map(orderId -> {
            OmsOrderOperateHistory history = new OmsOrderOperateHistory();
            history.setOrderId(orderId);
            history.setCreateTime(new Date());
            history.setOperateMan(CurrentMerchantUtil.getCurrentUsername());
            history.setOrderStatus(OmsOrderStatus.CANCELLED.getValue());
            history.setNote("订单关闭:"+note);
            return history;
        }).collect(Collectors.toList());
        orderOperateHistoryDao.insertList(historyList);
        return count;
    }

    @Override
    public int delete(List<Long> ids) {
        OmsOrderExample checkExample = new OmsOrderExample();
        checkExample.createCriteria().andIdIn(ids);
        for (OmsOrder order : orderMapper.selectByExample(checkExample)) {
            CurrentMerchantUtil.checkShop(order.getShopId());
        }
        OmsOrder record = new OmsOrder();
        record.setDeleteStatus(1);
        OmsOrderExample example = new OmsOrderExample();
        example.createCriteria().andDeleteStatusEqualTo(0).andIdIn(ids);
        return orderMapper.updateByExampleSelective(record, example);
    }

    @Override
    public OmsOrderDetail detail(Long id) {
        OmsOrderDetail detail = orderDao.getDetail(id);
        if (detail != null) {
            CurrentMerchantUtil.checkShop(detail.getShopId());
        }
        return detail;
    }

    @Override
    public int updateReceiverInfo(OmsReceiverInfoParam receiverInfoParam) {
        OmsOrder origin = orderMapper.selectByPrimaryKey(receiverInfoParam.getOrderId());
        if (origin != null) {
            CurrentMerchantUtil.checkShop(origin.getShopId());
        }
        OmsOrder order = new OmsOrder();
        order.setId(receiverInfoParam.getOrderId());
        order.setReceiverName(receiverInfoParam.getReceiverName());
        order.setReceiverPhone(receiverInfoParam.getReceiverPhone());
        order.setReceiverPostCode(receiverInfoParam.getReceiverPostCode());
        order.setReceiverDetailAddress(receiverInfoParam.getReceiverDetailAddress());
        order.setReceiverProvince(receiverInfoParam.getReceiverProvince());
        order.setReceiverCity(receiverInfoParam.getReceiverCity());
        order.setReceiverRegion(receiverInfoParam.getReceiverRegion());
        order.setModifyTime(new Date());
        int count = orderMapper.updateByPrimaryKeySelective(order);
        //插入操作记录
        OmsOrderOperateHistory history = new OmsOrderOperateHistory();
        history.setOrderId(receiverInfoParam.getOrderId());
        history.setCreateTime(new Date());
        history.setOperateMan(CurrentMerchantUtil.getCurrentUsername());
        history.setOrderStatus(receiverInfoParam.getStatus());
        history.setNote("修改收货人信息");
        orderOperateHistoryMapper.insert(history);
        return count;
    }

    @Override
    public int updateMoneyInfo(OmsMoneyInfoParam moneyInfoParam) {
        OmsOrder origin = orderMapper.selectByPrimaryKey(moneyInfoParam.getOrderId());
        if (origin != null) {
            CurrentMerchantUtil.checkShop(origin.getShopId());
        }
        OmsOrder order = new OmsOrder();
        order.setId(moneyInfoParam.getOrderId());
        order.setFreightAmount(moneyInfoParam.getFreightAmount());
        order.setDiscountAmount(moneyInfoParam.getDiscountAmount());
        order.setModifyTime(new Date());
        int count = orderMapper.updateByPrimaryKeySelective(order);
        //插入操作记录
        OmsOrderOperateHistory history = new OmsOrderOperateHistory();
        history.setOrderId(moneyInfoParam.getOrderId());
        history.setCreateTime(new Date());
        history.setOperateMan(CurrentMerchantUtil.getCurrentUsername());
        history.setOrderStatus(moneyInfoParam.getStatus());
        history.setNote("修改费用信息");
        orderOperateHistoryMapper.insert(history);
        return count;
    }

    @Override
    public int updateNote(Long id, String note, Integer status) {
        OmsOrder origin = orderMapper.selectByPrimaryKey(id);
        if (origin != null) {
            CurrentMerchantUtil.checkShop(origin.getShopId());
        }
        OmsOrder order = new OmsOrder();
        order.setId(id);
        order.setNote(note);
        order.setModifyTime(new Date());
        int count = orderMapper.updateByPrimaryKeySelective(order);
        OmsOrderOperateHistory history = new OmsOrderOperateHistory();
        history.setOrderId(id);
        history.setCreateTime(new Date());
        history.setOperateMan(CurrentMerchantUtil.getCurrentUsername());
        history.setOrderStatus(status);
        history.setNote("修改备注信息："+note);
        orderOperateHistoryMapper.insert(history);
        return count;
    }

    @Override
    public int paySuccess(List<Long> ids) {
        for (Long id : ids) {
            OmsOrder order = orderMapper.selectByPrimaryKey(id);
            if (order == null || !OmsOrderStatus.UNPAID.getValue().equals(order.getStatus())) {
                throw new RuntimeException("订单不存在或不是待支付状态，id=" + id);
            }
            CurrentMerchantUtil.checkShop(order.getShopId());
        }
        OmsOrder record = new OmsOrder();
        record.setStatus(OmsOrderStatus.PAID.getValue());
        record.setPayType(1);
        record.setPaymentTime(new Date());
        record.setModifyTime(new Date());
        OmsOrderExample example = new OmsOrderExample();
        example.createCriteria().andDeleteStatusEqualTo(0).andIdIn(ids);
        int count = orderMapper.updateByExampleSelective(record, example);
        List<OmsOrderOperateHistory> historyList = ids.stream().map(orderId -> {
            OmsOrderOperateHistory history = new OmsOrderOperateHistory();
            history.setOrderId(orderId);
            history.setCreateTime(new Date());
            history.setOperateMan(CurrentMerchantUtil.getCurrentUsername());
            history.setOrderStatus(OmsOrderStatus.PAID.getValue());
            history.setNote("模拟支付成功");
            return history;
        }).collect(Collectors.toList());
        orderOperateHistoryDao.insertList(historyList);
        return count;
    }

    @Override
    public int confirmPayment(List<Long> ids) {
        for (Long id : ids) {
            OmsOrder order = orderMapper.selectByPrimaryKey(id);
            if (order == null || !OmsOrderStatus.PAID.getValue().equals(order.getStatus())) {
                throw new RuntimeException("订单不存在或不是已支付状态，id=" + id);
            }
            CurrentMerchantUtil.checkShop(order.getShopId());
        }
        OmsOrder record = new OmsOrder();
        record.setStatus(OmsOrderStatus.PENDING_SHIPMENT.getValue());
        record.setModifyTime(new Date());
        OmsOrderExample example = new OmsOrderExample();
        example.createCriteria().andDeleteStatusEqualTo(0).andIdIn(ids);
        int count = orderMapper.updateByExampleSelective(record, example);
        List<OmsOrderOperateHistory> historyList = ids.stream().map(orderId -> {
            OmsOrderOperateHistory history = new OmsOrderOperateHistory();
            history.setOrderId(orderId);
            history.setCreateTime(new Date());
            history.setOperateMan(CurrentMerchantUtil.getCurrentUsername());
            history.setOrderStatus(OmsOrderStatus.PENDING_SHIPMENT.getValue());
            history.setNote("商家确认收款");
            return history;
        }).collect(Collectors.toList());
        orderOperateHistoryDao.insertList(historyList);
        return count;
    }

    @Override
    public int receive(List<Long> ids) {
        for (Long id : ids) {
            OmsOrder order = orderMapper.selectByPrimaryKey(id);
            if (order == null || !OmsOrderStatus.SHIPPED.getValue().equals(order.getStatus())) {
                throw new RuntimeException("订单不存在或不是已发货状态，id=" + id);
            }
            CurrentMerchantUtil.checkShop(order.getShopId());
        }
        OmsOrder record = new OmsOrder();
        record.setStatus(OmsOrderStatus.RECEIVED.getValue());
        record.setReceiveTime(new Date());
        record.setConfirmStatus(1);
        record.setModifyTime(new Date());
        OmsOrderExample example = new OmsOrderExample();
        example.createCriteria().andDeleteStatusEqualTo(0).andIdIn(ids);
        int count = orderMapper.updateByExampleSelective(record, example);
        List<OmsOrderOperateHistory> historyList = ids.stream().map(orderId -> {
            OmsOrderOperateHistory history = new OmsOrderOperateHistory();
            history.setOrderId(orderId);
            history.setCreateTime(new Date());
            history.setOperateMan(CurrentMerchantUtil.getCurrentUsername());
            history.setOrderStatus(OmsOrderStatus.RECEIVED.getValue());
            history.setNote("确认收货");
            return history;
        }).collect(Collectors.toList());
        orderOperateHistoryDao.insertList(historyList);
        return count;
    }

    @Override
    public int complete(List<Long> ids) {
        for (Long id : ids) {
            OmsOrder order = orderMapper.selectByPrimaryKey(id);
            if (order == null || !OmsOrderStatus.RECEIVED.getValue().equals(order.getStatus())) {
                throw new RuntimeException("订单不存在或不是已收货状态，id=" + id);
            }
            CurrentMerchantUtil.checkShop(order.getShopId());
        }
        OmsOrder record = new OmsOrder();
        record.setStatus(OmsOrderStatus.COMPLETED.getValue());
        record.setModifyTime(new Date());
        OmsOrderExample example = new OmsOrderExample();
        example.createCriteria().andDeleteStatusEqualTo(0).andIdIn(ids);
        int count = orderMapper.updateByExampleSelective(record, example);
        List<OmsOrderOperateHistory> historyList = ids.stream().map(orderId -> {
            OmsOrderOperateHistory history = new OmsOrderOperateHistory();
            history.setOrderId(orderId);
            history.setCreateTime(new Date());
            history.setOperateMan(CurrentMerchantUtil.getCurrentUsername());
            history.setOrderStatus(OmsOrderStatus.COMPLETED.getValue());
            history.setNote("订单完成");
            return history;
        }).collect(Collectors.toList());
        orderOperateHistoryDao.insertList(historyList);
        return count;
    }
}
