package com.macro.mall.util;

import com.macro.mall.bo.AdminUserDetails;
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
}
