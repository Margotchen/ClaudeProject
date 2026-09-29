package com.macro.mall.util;

import com.macro.mall.bo.AdminUserDetails;
import com.macro.mall.common.exception.ApiException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class CurrentMerchantUtil {
    public static Long getCurrentShopId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AdminUserDetails) {
            AdminUserDetails details = (AdminUserDetails) authentication.getPrincipal();
            return details.getUmsAdmin().getMerchantId();
        }
        return null;
    }

    public static boolean isPlatformAdmin() {
        return getCurrentShopId() == null;
    }

    /**
     * 校验目标数据归属当前店铺；平台管理员（shopId 为空）放行
     */
    public static void checkShop(Long targetShopId) {
        Long current = getCurrentShopId();
        if (current != null && (targetShopId == null || !current.equals(targetShopId))) {
            throw new ApiException("无权操作其他店铺的数据");
        }
    }

    /**
     * 当前登录用户名（用于操作记录），取不到时返回默认操作人
     */
    public static String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AdminUserDetails) {
            AdminUserDetails details = (AdminUserDetails) authentication.getPrincipal();
            return details.getUsername();
        }
        return "后台管理员";
    }
}
