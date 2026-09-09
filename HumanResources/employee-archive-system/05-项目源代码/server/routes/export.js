const express = require('express');
const router = express.Router();
const { buildEmployeeExcel } = require('../utils/excel');
const { buildEmployeePdf } = require('../utils/pdf');

const ALL_FIELDS = [
    { key: 'employee_no', label: '工号' },
    { key: 'name', label: '姓名' },
    { key: 'gender', label: '性别' },
    { key: 'department', label: '部门' },
    { key: 'position', label: '岗位' },
    { key: 'id_card', label: '身份证号' },
    { key: 'phone', label: '手机号' },
    { key: 'email', label: '邮箱' },
    { key: 'entry_date', label: '入职日期' },
    { key: 'status', label: '在职状态' },
    { key: 'emergency_contact', label: '紧急联系人' },
    { key: 'emergency_phone', label: '紧急联系电话' },
    { key: 'address', label: '居住地址' }
];

// 导出花名册
router.get('/employees', async (req, res) => {
    const db = req.db;
    const { format = 'xlsx', fields, keyword = '', department = '', status = 1, filename } = req.query;

    let whereSql = 'WHERE status = ?';
    let params = [Number(status)];

    if (keyword) {
        whereSql += ' AND (name LIKE ? OR employee_no LIKE ?)';
        params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (department) {
        whereSql += ' AND department = ?';
        params.push(department);
    }

    const sql = `SELECT * FROM employees ${whereSql} ORDER BY entry_date DESC`;

    try {
        const rows = db.prepare(sql).all(...params);

        if (rows.length === 0) {
            return res.status(400).json({ code: 400, message: '暂无数据可导出' });
        }

        let exportFields = ALL_FIELDS;
        if (fields) {
            const fieldKeys = String(fields).split(',');
            exportFields = ALL_FIELDS.filter(f => fieldKeys.includes(f.key));
        }

        const data = rows.map(item => ({
            ...item,
            gender: item.gender === 1 ? '男' : item.gender === 2 ? '女' : '未知',
            status: item.status === 1 ? '在职' : item.status === 2 ? '离职' : '删除'
        }));

        const safeFilename = filename || `花名册_${dayjsStamp()}${department ? '_' + department : ''}`;

        const encodedFilename = encodeURIComponent(`${safeFilename}.${format}`);
        if (format === 'pdf') {
            const buffer = await buildEmployeePdf(data, exportFields, safeFilename);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
            return res.send(buffer);
        }

        const buffer = buildEmployeeExcel(data, exportFields);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
        return res.send(buffer);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ code: 500, message: '导出失败：' + err.message });
    }
});

function dayjsStamp() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
}

module.exports = router;
