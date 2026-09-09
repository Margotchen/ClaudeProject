const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '../data/benefit_system.sqlite');
const db = new Database(dbPath);

db.exec('PRAGMA foreign_keys = ON');

const cleanup = db.transaction(() => {
  // 清理申领明细与主表
  db.exec('DELETE FROM welfare_apply_item');
  db.exec('DELETE FROM welfare_apply');
  // 清理活动-礼品关联与活动
  db.exec('DELETE FROM activity_gift_rel');
  db.exec('DELETE FROM welfare_activity');
  // 清理测试地址与操作日志
  db.exec('DELETE FROM user_address');
  db.exec('DELETE FROM sys_operate_log');
  // 删除非初始化礼品，恢复初始 4 个礼品库存与状态
  db.exec('DELETE FROM gift_info WHERE id > 4');
  db.exec(`UPDATE gift_info
           SET stock = CASE id
             WHEN 1 THEN 100
             WHEN 2 THEN 150
             WHEN 3 THEN 80
             WHEN 4 THEN 120
           END,
           status = 1,
           update_time = CURRENT_TIMESTAMP
           WHERE id IN (1,2,3,4)`);
  // 重置自增序列
  const tables = [
    'welfare_apply_item',
    'welfare_apply',
    'activity_gift_rel',
    'welfare_activity',
    'user_address',
    'sys_operate_log',
    'gift_info'
  ];
  for (const t of tables) {
    db.exec(`DELETE FROM sqlite_sequence WHERE name='${t}'`);
  }
});

cleanup();

console.log('清理完成，当前数据：');
console.log('  activities:', db.prepare('SELECT COUNT(*) AS c FROM welfare_activity').get().c);
console.log('  applies:', db.prepare('SELECT COUNT(*) AS c FROM welfare_apply').get().c);
console.log('  apply_items:', db.prepare('SELECT COUNT(*) AS c FROM welfare_apply_item').get().c);
console.log('  addresses:', db.prepare('SELECT COUNT(*) AS c FROM user_address').get().c);
console.log('  logs:', db.prepare('SELECT COUNT(*) AS c FROM sys_operate_log').get().c);
console.log('  gifts:', JSON.stringify(db.prepare('SELECT id, gift_name, stock, status FROM gift_info').all()));

db.close();
