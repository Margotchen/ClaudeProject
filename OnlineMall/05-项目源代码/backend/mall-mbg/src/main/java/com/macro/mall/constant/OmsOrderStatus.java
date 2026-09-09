package com.macro.mall.constant;

/**
 * 订单状态枚举
 * 对应 PRD 中 8 种核心订单状态
 */
public enum OmsOrderStatus {
    /**
     * 待支付：订单创建后初始状态，等待用户付款
     */
    UNPAID(1, "待支付"),

    /**
     * 已支付：支付成功后自动流转，等待商家发货
     */
    PAID(2, "已支付"),

    /**
     * 待发货：商家确认收款后，待录入物流信息
     */
    PENDING_SHIPMENT(3, "待发货"),

    /**
     * 已发货：商家填写物流信息后，订单标记为发货状态
     */
    SHIPPED(4, "已发货"),

    /**
     * 已收货：用户确认收货后流转
     */
    RECEIVED(5, "已收货"),

    /**
     * 已完成：收货后超过售后期或无售后，订单完结
     */
    COMPLETED(6, "已完成"),

    /**
     * 已取消：待支付状态下用户取消，或支付超时自动取消
     */
    CANCELLED(7, "已取消"),

    /**
     * 售后中：用户发起退款 / 退货申请后进入该状态
     */
    AFTER_SALE(8, "售后中");

    private final Integer value;
    private final String label;

    OmsOrderStatus(Integer value, String label) {
        this.value = value;
        this.label = label;
    }

    public Integer getValue() {
        return value;
    }

    public String getLabel() {
        return label;
    }

    public static String getLabel(Integer value) {
        if (value == null) {
            return "";
        }
        for (OmsOrderStatus status : values()) {
            if (status.value.equals(value)) {
                return status.label;
            }
        }
        return "";
    }

    public static OmsOrderStatus of(Integer value) {
        if (value == null) {
            return null;
        }
        for (OmsOrderStatus status : values()) {
            if (status.value.equals(value)) {
                return status;
            }
        }
        return null;
    }
}
