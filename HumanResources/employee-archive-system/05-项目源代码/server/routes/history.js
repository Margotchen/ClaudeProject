const express = require('express');
const router = express.Router();

// 变动历史列表
router.get('/', (req, res) => {
    const db = req.db;
    const { page = 1, pageSize = 20, employee_id, change_type, start_date, end_date } = req.query;

    let whereSql = 'WHERE 1=1';
    let params = [];

    if (employee_id) {
        whereSql += ' AND h.employee_id = ?';
        params.push(employee_id);
    }
    if (change_type) {
        whereSql += ' AND h.change_type = ?';
        params.push(change_type);
    }
    if (start_date) {
        whereSql += ' AND h.operate_time >= ?';
        params.push(`${start_date} 00:00:00`);
    }
    if (end_date) {
        whereSql += ' AND h.operate_time <= ?';
        params.push(`${end_date} 23:59:59`);
    }

    const offset = (page - 1) * pageSize;
    const countSql = `SELECT COUNT(*) as total FROM change_history h ${whereSql}`;
    const listSql = `
        SELECT h.*, e.employee_no, e.name, e.department
        FROM change_history h
        LEFT JOIN employees e ON h.employee_id = e.id
        ${whereSql}
        ORDER BY h.operate_time DESC
        LIMIT ? OFFSET ?
    `;

    try {
        const countResult = db.prepare(countSql).get(...params);
        const list = db.prepare(listSql).all(...params, Number(pageSize), offset);

        const parsedList = list.map(row => ({
            ...row,
            before_value: safeParse(row.before_value),
            after_value: safeParse(row.after_value)
        }));

        res.json({
            code: 0,
            data: {
                list: parsedList,
                total: countResult.total,
                page: Number(page),
                pageSize: Number(pageSize)
            }
        });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// 获取变动类型枚举
router.get('/types', (req, res) => {
    const db = req.db;
    try {
        const rows = db.prepare('SELECT DISTINCT change_type FROM change_history ORDER BY change_type').all();
        res.json({ code: 0, data: rows.map(r => r.change_type) });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

function safeParse(str) {
    if (!str) return null;
    try {
        return JSON.parse(str);
    } catch (e) {
        return str;
    }
}

module.exports = router;
