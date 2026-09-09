-- 在线商城订单管理系统 - 数据库升级脚本
-- 阶段 2：商家角色与数据权限改造

-- 1. 创建商家信息表
CREATE TABLE IF NOT EXISTS `ums_merchant` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `shop_name` varchar(255) NOT NULL COMMENT '店铺名称',
  `status` int NOT NULL DEFAULT '1' COMMENT '状态：0-禁用 1-启用',
  `contact_name` varchar(100) DEFAULT NULL COMMENT '联系人',
  `contact_phone` varchar(20) DEFAULT NULL COMMENT '联系电话',
  `create_time` datetime DEFAULT NULL,
  `update_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商家信息表';

-- 2. 初始化示例商家
INSERT INTO `ums_merchant` (`shop_name`, `status`, `contact_name`, `contact_phone`, `create_time`, `update_time`)
SELECT '示例店铺', 1, '张三', '13800138000', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `ums_merchant` WHERE `shop_name` = '示例店铺');

-- 3. 扩展后台用户表，增加所属商家ID
SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE `ums_admin` ADD COLUMN `merchant_id` bigint DEFAULT NULL COMMENT "所属商家ID" AFTER `status`',
        'SELECT 1'
    )
    FROM `INFORMATION_SCHEMA`.`COLUMNS`
    WHERE `TABLE_SCHEMA` = DATABASE() AND `TABLE_NAME` = 'ums_admin' AND `COLUMN_NAME` = 'merchant_id'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. 将测试账号 test 关联到示例商家
UPDATE `ums_admin` SET `merchant_id` = 1 WHERE `username` = 'test';

-- 5. 扩展商品表，增加所属店铺ID
SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE `pms_product` ADD COLUMN `shop_id` bigint DEFAULT NULL COMMENT "所属商家ID" AFTER `brand_id`',
        'SELECT 1'
    )
    FROM `INFORMATION_SCHEMA`.`COLUMNS`
    WHERE `TABLE_SCHEMA` = DATABASE() AND `TABLE_NAME` = 'pms_product' AND `COLUMN_NAME` = 'shop_id'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. 初始化现有商品归属到示例商家
UPDATE `pms_product` SET `shop_id` = 1 WHERE `shop_id` IS NULL;

-- 7. 扩展订单表，增加所属店铺ID
SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE `oms_order` ADD COLUMN `shop_id` bigint DEFAULT NULL COMMENT "所属商家ID" AFTER `member_id`',
        'SELECT 1'
    )
    FROM `INFORMATION_SCHEMA`.`COLUMNS`
    WHERE `TABLE_SCHEMA` = DATABASE() AND `TABLE_NAME` = 'oms_order' AND `COLUMN_NAME` = 'shop_id'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 8. 初始化现有订单归属到示例商家
UPDATE `oms_order` SET `shop_id` = 1 WHERE `shop_id` IS NULL;

-- 9. 创建商家角色
INSERT INTO `ums_role` (`name`, `description`, `admin_count`, `create_time`, `status`, `sort`)
SELECT '商家', '商家角色，仅可管理自身店铺数据', 0, NOW(), 1, 0
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `ums_role` WHERE `name` = '商家');

SET @merchant_role_id = (SELECT `id` FROM `ums_role` WHERE `name` = '商家');

-- 10. 为商家角色分配菜单权限（商品列表、添加商品、订单列表、退货申请处理）
INSERT INTO `ums_role_menu_relation` (`role_id`, `menu_id`)
SELECT @merchant_role_id, `id` FROM `ums_menu`
WHERE `name` IN ('product', 'addProduct', 'order', 'returnApply')
AND NOT EXISTS (
    SELECT 1 FROM `ums_role_menu_relation`
    WHERE `role_id` = @merchant_role_id AND `menu_id` = `ums_menu`.`id`
);

-- 11. 插入商家管理菜单到权限模块下
INSERT INTO `ums_menu` (`parent_id`, `name`, `title`, `level`, `sort`, `icon`, `hidden`, `create_time`)
SELECT 21, 'merchant', '商家管理', 1, 0, 'ums-admin', 0, NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `ums_menu` WHERE `name` = 'merchant');

SET @merchant_menu_id = (SELECT `id` FROM `ums_menu` WHERE `name` = 'merchant');

-- 12. 为超级管理员角色分配商家管理菜单
INSERT INTO `ums_role_menu_relation` (`role_id`, `menu_id`)
SELECT 5, @merchant_menu_id
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM `ums_role_menu_relation`
    WHERE `role_id` = 5 AND `menu_id` = @merchant_menu_id
);

-- 13. 注册商家管理接口资源
INSERT INTO `ums_resource` (`name`, `url`, `description`, `category_id`)
SELECT '商家管理', '/merchant/**', '商家管理接口', 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `ums_resource` WHERE `url` = '/merchant/**');

SET @merchant_resource_id = (SELECT `id` FROM `ums_resource` WHERE `url` = '/merchant/**');

-- 14. 为超级管理员角色分配商家管理资源
INSERT INTO `ums_role_resource_relation` (`role_id`, `resource_id`)
SELECT 5, @merchant_resource_id
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM `ums_role_resource_relation`
    WHERE `role_id` = 5 AND `resource_id` = @merchant_resource_id
);

-- 15. 为商家角色分配商品和订单相关资源
INSERT INTO `ums_role_resource_relation` (`role_id`, `resource_id`)
SELECT @merchant_role_id, `id` FROM `ums_resource`
WHERE `url` IN ('/product/**', '/order/**', '/admin/info', '/admin/logout')
AND NOT EXISTS (
    SELECT 1 FROM `ums_role_resource_relation`
    WHERE `role_id` = @merchant_role_id AND `resource_id` = `ums_resource`.`id`
);

-- 16. 为 test 账号分配商家角色，并移除超级管理员角色
DELETE FROM `ums_admin_role_relation`
WHERE `admin_id` = (SELECT `id` FROM `ums_admin` WHERE `username` = 'test');

INSERT INTO `ums_admin_role_relation` (`admin_id`, `role_id`)
SELECT `id`, @merchant_role_id FROM `ums_admin` WHERE `username` = 'test';

-- ============================================
-- 阶段 3：订单状态机改造（8 种状态）
-- 新状态：1-待支付 2-已支付 3-待发货 4-已发货 5-已收货 6-已完成 7-已取消 8-售后中
-- 旧状态：0-待付款 1-待发货 2-已发货 3-已完成 4-已关闭 5-无效订单
-- ============================================

UPDATE `oms_order` SET `status` = 1 WHERE `status` = 0;
UPDATE `oms_order` SET `status` = 3 WHERE `status` = 1;
UPDATE `oms_order` SET `status` = 4 WHERE `status` = 2;
UPDATE `oms_order` SET `status` = 6 WHERE `status` = 3;
UPDATE `oms_order` SET `status` = 7 WHERE `status` IN (4, 5);

UPDATE `oms_order_operate_history` SET `order_status` = 1 WHERE `order_status` = 0;
UPDATE `oms_order_operate_history` SET `order_status` = 3 WHERE `order_status` = 1;
UPDATE `oms_order_operate_history` SET `order_status` = 4 WHERE `order_status` = 2;
UPDATE `oms_order_operate_history` SET `order_status` = 6 WHERE `order_status` = 3;
UPDATE `oms_order_operate_history` SET `order_status` = 7 WHERE `order_status` IN (4, 5);

-- ============================================
-- 阶段 4：物流与售后模块改造
-- ============================================

-- 1. 物流轨迹表（发货后写入模拟轨迹）
CREATE TABLE IF NOT EXISTS `oms_order_logistics_trace` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_id` bigint NOT NULL COMMENT '订单ID',
  `content` varchar(500) NOT NULL COMMENT '轨迹内容',
  `create_time` datetime DEFAULT NULL COMMENT '轨迹时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物流轨迹表';

-- 2. 扩展售后申请表
SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE `oms_order_return_apply` ADD COLUMN `return_type` int DEFAULT 1 COMMENT "售后类型：1-退货 2-退款" AFTER `order_id`',
        'SELECT 1'
    )
    FROM `INFORMATION_SCHEMA`.`COLUMNS`
    WHERE `TABLE_SCHEMA` = DATABASE() AND `TABLE_NAME` = 'oms_order_return_apply' AND `COLUMN_NAME` = 'return_type'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE `oms_order_return_apply` ADD COLUMN `handle_remark` varchar(500) DEFAULT NULL COMMENT "处理意见" AFTER `handle_man`',
        'SELECT 1'
    )
    FROM `INFORMATION_SCHEMA`.`COLUMNS`
    WHERE `TABLE_SCHEMA` = DATABASE() AND `TABLE_NAME` = 'oms_order_return_apply' AND `COLUMN_NAME` = 'handle_remark'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE `oms_order_return_apply` ADD COLUMN `pre_status` int DEFAULT NULL COMMENT "售后前订单状态" AFTER `handle_remark`',
        'SELECT 1'
    )
    FROM `INFORMATION_SCHEMA`.`COLUMNS`
    WHERE `TABLE_SCHEMA` = DATABASE() AND `TABLE_NAME` = 'oms_order_return_apply' AND `COLUMN_NAME` = 'pre_status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. 售后凭证图片表
CREATE TABLE IF NOT EXISTS `oms_return_apply_image` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `apply_id` bigint NOT NULL COMMENT '售后申请ID',
  `url` varchar(500) NOT NULL COMMENT '图片URL',
  `create_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_apply_id` (`apply_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='售后申请凭证图片表';
