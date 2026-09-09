package com.macro.mall.util;

import com.macro.mall.constant.OmsOrderStatus;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * 订单状态机工具类
 */
public class OrderStatusMachine {

    private static final Map<OmsOrderStatus, Set<OmsOrderStatus>> TRANSITIONS = new EnumMap<>(OmsOrderStatus.class);

    static {
        TRANSITIONS.put(OmsOrderStatus.UNPAID, EnumSet.of(OmsOrderStatus.PAID, OmsOrderStatus.CANCELLED, OmsOrderStatus.AFTER_SALE));
        TRANSITIONS.put(OmsOrderStatus.PAID, EnumSet.of(OmsOrderStatus.PENDING_SHIPMENT, OmsOrderStatus.AFTER_SALE));
        TRANSITIONS.put(OmsOrderStatus.PENDING_SHIPMENT, EnumSet.of(OmsOrderStatus.SHIPPED, OmsOrderStatus.AFTER_SALE));
        TRANSITIONS.put(OmsOrderStatus.SHIPPED, EnumSet.of(OmsOrderStatus.RECEIVED, OmsOrderStatus.AFTER_SALE));
        TRANSITIONS.put(OmsOrderStatus.RECEIVED, EnumSet.of(OmsOrderStatus.COMPLETED, OmsOrderStatus.AFTER_SALE));
        TRANSITIONS.put(OmsOrderStatus.AFTER_SALE, EnumSet.of(OmsOrderStatus.COMPLETED, OmsOrderStatus.CANCELLED));
    }

    /**
     * 判断从 fromStatus 是否可以流转到 toStatus
     */
    public static boolean canTransition(int fromStatus, int toStatus) {
        OmsOrderStatus from = OmsOrderStatus.of(fromStatus);
        OmsOrderStatus to = OmsOrderStatus.of(toStatus);
        return canTransition(from, to);
    }

    /**
     * 判断从 from 是否可以流转到 to
     */
    public static boolean canTransition(OmsOrderStatus from, OmsOrderStatus to) {
        if (from == to) {
            return true;
        }
        Set<OmsOrderStatus> allowed = TRANSITIONS.get(from);
        return allowed != null && allowed.contains(to);
    }
}
