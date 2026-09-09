package com.macro.mall.util;

import com.macro.mall.constant.OmsOrderStatus;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class OrderStatusMachineTest {

    @Test
    public void testValidTransitions() {
        assertTrue(OrderStatusMachine.canTransition(OmsOrderStatus.UNPAID, OmsOrderStatus.PAID));
        assertTrue(OrderStatusMachine.canTransition(OmsOrderStatus.UNPAID, OmsOrderStatus.CANCELLED));
        assertTrue(OrderStatusMachine.canTransition(OmsOrderStatus.PAID, OmsOrderStatus.PENDING_SHIPMENT));
        assertTrue(OrderStatusMachine.canTransition(OmsOrderStatus.PENDING_SHIPMENT, OmsOrderStatus.SHIPPED));
        assertTrue(OrderStatusMachine.canTransition(OmsOrderStatus.SHIPPED, OmsOrderStatus.RECEIVED));
        assertTrue(OrderStatusMachine.canTransition(OmsOrderStatus.RECEIVED, OmsOrderStatus.COMPLETED));
        assertTrue(OrderStatusMachine.canTransition(OmsOrderStatus.AFTER_SALE, OmsOrderStatus.COMPLETED));
        assertTrue(OrderStatusMachine.canTransition(OmsOrderStatus.AFTER_SALE, OmsOrderStatus.CANCELLED));
    }

    @Test
    public void testInvalidTransitions() {
        assertFalse(OrderStatusMachine.canTransition(OmsOrderStatus.UNPAID, OmsOrderStatus.SHIPPED));
        assertFalse(OrderStatusMachine.canTransition(OmsOrderStatus.UNPAID, OmsOrderStatus.COMPLETED));
        assertFalse(OrderStatusMachine.canTransition(OmsOrderStatus.COMPLETED, OmsOrderStatus.PAID));
        assertFalse(OrderStatusMachine.canTransition(OmsOrderStatus.CANCELLED, OmsOrderStatus.PAID));
    }

    @Test
    public void testSameStatusAllowed() {
        assertTrue(OrderStatusMachine.canTransition(OmsOrderStatus.PAID.getValue(), OmsOrderStatus.PAID.getValue()));
    }
}
