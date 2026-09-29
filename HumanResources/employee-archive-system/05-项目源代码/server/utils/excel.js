const XLSX = require('xlsx');

/**
 * 生成 Excel 工作簿
 * @param {Array} data 员工数据
 * @param {Array} fields 导出字段配置 [{ key, label }]
 * @returns {Buffer}
 */
function buildEmployeeExcel(data, fields) {
    const rows = data.map(item => {
        const row = {};
        fields.forEach(f => {
            row[f.label] = item[f.key] ?? '';
        });
        return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '花名册');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = { buildEmployeeExcel };
