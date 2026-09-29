const ExcelJS = require('exceljs');
const { writeToBuffer } = require('fast-csv');

const statusMap = { 1: '待发货', 2: '已发货', 3: '已签收', 4: '已取消' };

// 统一的申领明细导出 schema
const applyExportSchema = [
  { key: 'activity_name', header: '活动名称', width: 24 },
  { key: 'user_no', header: '员工工号', width: 16 },
  { key: 'real_name', header: '员工姓名', width: 16 },
  { key: 'department', header: '所属部门', width: 20 },
  { key: 'gift_name', header: '礼品名称', width: 24 },
  { key: 'specification', header: '礼品规格', width: 24 },
  { key: 'quantity', header: '申领数量', width: 12 },
  { key: 'receiver', header: '收货人', width: 16 },
  { key: 'phone', header: '联系电话', width: 16 },
  { key: 'address', header: '完整收货地址', width: 40 },
  { key: 'apply_time', header: '申领时间', width: 20 },
  { key: 'delivery_status', header: '发货状态', width: 12 },
  { key: 'sign_status', header: '签收状态', width: 12 },
  { key: 'express_company', header: '物流公司', width: 16 },
  { key: 'express_no', header: '快递单号', width: 20 }
];

function toApplyExportRows(applies) {
  const rows = [];
  (applies || []).forEach(row => {
    const items = row.items || [];
    if (items.length === 0) {
      // 即使没有明细也导出主表记录，保证数据不遗漏
      rows.push({
        activity_name: row.activity?.activity_name || '',
        user_no: row.user?.user_no || '',
        real_name: row.user?.real_name || '',
        department: row.user?.department || '',
        gift_name: '',
        specification: '',
        quantity: '',
        receiver: row.receiver_snapshot || '',
        phone: row.phone_snapshot || '',
        address: row.address_snapshot || '',
        apply_time: row.create_time || '',
        delivery_status: statusMap[row.apply_status] || '',
        sign_status: row.apply_status === 3 ? '已签收' : '未签收',
        express_company: row.express_company || '',
        express_no: row.express_no || ''
      });
      return;
    }

    items.forEach(item => {
      rows.push({
        activity_name: row.activity?.activity_name || '',
        user_no: row.user?.user_no || '',
        real_name: row.user?.real_name || '',
        department: row.user?.department || '',
        gift_name: item.gift_name_snapshot || '',
        specification: item.spec_snapshot || '',
        quantity: item.quantity,
        receiver: row.receiver_snapshot || '',
        phone: row.phone_snapshot || '',
        address: row.address_snapshot || '',
        apply_time: row.create_time || '',
        delivery_status: statusMap[row.apply_status] || '',
        sign_status: row.apply_status === 3 ? '已签收' : '未签收',
        express_company: row.express_company || '',
        express_no: row.express_no || ''
      });
    });
  });
  return rows;
}

const exportApplyToExcel = async (applies) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('申领明细');

  worksheet.columns = applyExportSchema.map(col => ({
    header: col.header,
    key: col.key,
    width: col.width
  }));

  const rows = toApplyExportRows(applies);
  rows.forEach(row => worksheet.addRow(row));

  return await workbook.xlsx.writeBuffer();
};

const exportApplyToCsv = async (applies) => {
  const rows = toApplyExportRows(applies);
  const headers = applyExportSchema.reduce((obj, col) => {
    obj[col.key] = col.header;
    return obj;
  }, {});

  let csvContent;
  if (rows.length === 0) {
    // writeToBuffer 在空数组时不会写出表头，手动补一行表头
    csvContent = applyExportSchema.map(col => col.header).join(',') + '\n';
  } else {
    const buffer = await writeToBuffer(rows, { headers, writeHeaders: true });
    csvContent = buffer.toString();
  }

  // 添加 UTF-8 BOM，保证 Excel 打开 CSV 中文不乱码
  return Buffer.concat([Buffer.from('﻿'), Buffer.from(csvContent)]);
};

// 统计报表 workbook 生成
async function buildStatisticsWorkbook(statisticsService) {
  const ExcelJS = require('exceljs');
  const [stats, topGifts, departments, deliveryProgress] = await Promise.all([
    statisticsService.getDashboardStats(),
    statisticsService.getTopGifts(),
    statisticsService.getDepartmentParticipation(),
    statisticsService.getDeliveryProgress()
  ]);

  const workbook = new ExcelJS.Workbook();

  const sheets = [
    {
      name: '核心指标',
      columns: [
        { header: '指标', key: 'name', width: 24 },
        { header: '数值', key: 'value', width: 16 }
      ],
      rows: [
        { name: '活动总数', value: stats.totalActivities },
        { name: '进行中活动数', value: stats.ongoingActivities },
        { name: '累计申领人次', value: stats.totalApplyCount },
        { name: '待发货数量', value: stats.pendingDeliverCount }
      ]
    },
    {
      name: '礼品申领排行',
      columns: [
        { header: '礼品名称', key: 'gift_name', width: 30 },
        { header: '申领数量', key: 'total_quantity', width: 16 }
      ],
      rows: topGifts
    },
    {
      name: '部门参与率',
      columns: [
        { header: '部门', key: 'department', width: 24 },
        { header: '申领人数', key: 'apply_users', width: 16 },
        { header: '总人数', key: 'total_users', width: 16 },
        { header: '参与率(%)', key: 'rate', width: 16 }
      ],
      rows: departments
    },
    {
      name: '发货进度',
      columns: [
        { header: '活动名称', key: 'activity_name', width: 30 },
        { header: '待发货', key: 'pending', width: 12 },
        { header: '已发货', key: 'delivered', width: 12 },
        { header: '已签收', key: 'signed', width: 12 }
      ],
      rows: deliveryProgress
    }
  ];

  sheets.forEach(sheet => {
    const ws = workbook.addWorksheet(sheet.name);
    ws.columns = sheet.columns;
    (sheet.rows || []).forEach(row => ws.addRow(row));
  });

  return await workbook.xlsx.writeBuffer();
}

module.exports = {
  exportApplyToExcel,
  exportApplyToCsv,
  buildStatisticsWorkbook
};
