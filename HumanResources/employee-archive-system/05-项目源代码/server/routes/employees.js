const express = require('express');
const router = express.Router();
const _ = require('lodash');
const { maskPhone, maskIdCard } = require('../utils/mask');
const { validateEmployee } = require('../middleware/validator');

// 员工列表
router.get('/', (req, res) => {
    const { page = 1, pageSize = 20, keyword = '', department = '', status = 1, sortField = 'entry_date', sortOrder = 'desc' } = req.query;
    const db = req.db;

    const safeSortField = ['entry_date', 'created_at', 'name', 'employee_no'].includes(sortField) ? sortField : 'entry_date';
    const safeSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

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

    const offset = (page - 1) * pageSize;

    const countSql = `SELECT COUNT(*) as total FROM employees ${whereSql}`;
    const listSql = `SELECT * FROM employees ${whereSql} ORDER BY ${safeSortField} ${safeSortOrder} LIMIT ? OFFSET ?`;

    try {
        const countResult = db.prepare(countSql).get(...params);
        const list = db.prepare(listSql).all(...params, Number(pageSize), offset);

        // 数据脱敏
        const maskedList = list.map(item => ({
            ...item,
            phone: maskPhone(item.phone),
            id_card: maskIdCard(item.id_card)
        }));

        res.json({
            code: 0,
            data: {
                list: maskedList,
                total: countResult.total,
                page: Number(page),
                pageSize: Number(pageSize)
            }
        });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// 员工详情
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const db = req.db;

    try {
        const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
        if (!employee) return res.status(404).json({ code: 404, message: '员工不存在' });

        const contracts = db.prepare('SELECT * FROM contracts WHERE employee_id = ? ORDER BY start_date DESC').all(id);
        const education = db.prepare('SELECT * FROM education WHERE employee_id = ? ORDER BY start_date DESC').all(id);
        const workExp = db.prepare('SELECT * FROM work_experience WHERE employee_id = ? ORDER BY start_date DESC').all(id);

        res.json({
            code: 0,
            data: { employee, contracts, education, workExperience: workExp }
        });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// 新增员工
router.post('/', validateEmployee, (req, res) => {
    const db = req.db;
    const data = req.body;

    try {
        const exist = db.prepare('SELECT id FROM employees WHERE employee_no = ?').get(data.employee_no);
        if (exist) {
            return res.status(400).json({ code: 400, message: '工号已存在，请更换工号' });
        }

        const fields = ['employee_no', 'name', 'gender', 'department', 'position', 'id_card', 'phone', 'email', 'entry_date', 'emergency_contact', 'emergency_phone', 'address'];
        const values = fields.map(f => data[f] || null);
        const placeholders = fields.map(() => '?').join(', ');

        const sql = `INSERT INTO employees (${fields.join(', ')}) VALUES (${placeholders})`;
        const insertResult = db.prepare(sql).run(values);
        const empId = insertResult.lastInsertRowid;

        // 记录变动历史
        db.prepare(
            'INSERT INTO change_history (employee_id, change_type, after_value, remark) VALUES (?, ?, ?, ?)'
        ).run(empId, '入职', JSON.stringify(data), '新员工入职建档');

        // 如果附带合同信息，同步创建合同
        if (data.contract) {
            db.prepare(
                'INSERT INTO contracts (employee_id, contract_type, start_date, end_date, remark) VALUES (?, ?, ?, ?, ?)'
            ).run(empId, data.contract.contract_type, data.contract.start_date, data.contract.end_date, data.contract.remark || '');
        }

        res.json({ code: 0, message: '创建成功', data: { id: empId } });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// 更新员工
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const db = req.db;
    const data = req.body;

    try {
        const before = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
        if (!before) return res.status(404).json({ code: 404, message: '员工不存在' });

        const updatable = ['name', 'gender', 'department', 'position', 'id_card', 'phone', 'email', 'entry_date', 'status', 'emergency_contact', 'emergency_phone', 'address'];
        const updates = [];
        const values = [];

        updatable.forEach(field => {
            if (data[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(data[field]);
            }
        });

        if (updates.length === 0) {
            return res.json({ code: 0, message: '无更新内容' });
        }

        values.push(id);
        const sql = `UPDATE employees SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        db.prepare(sql).run(values);

        // 记录变动历史 - 对比变更字段
        const changes = {};
        updatable.forEach(f => {
            if (data[f] !== undefined && data[f] !== before[f]) {
                changes[f] = { before: before[f], after: data[f] };
            }
        });

        let changeType = '信息变更';
        if (data.department && data.department !== before.department) {
            changeType = '转岗';
        }
        if (data.status === 2 && before.status === 1) {
            changeType = '离职';
        }

        db.prepare(
            'INSERT INTO change_history (employee_id, change_type, before_value, after_value, remark) VALUES (?, ?, ?, ?, ?)'
        ).run(id, changeType, JSON.stringify(before), JSON.stringify(data), JSON.stringify(changes));

        res.json({ code: 0, message: '更新成功' });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// 删除员工（逻辑删除）
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const db = req.db;

    try {
        db.prepare('UPDATE employees SET status = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
        db.prepare(
            'INSERT INTO change_history (employee_id, change_type, remark) VALUES (?, ?, ?)'
        ).run(id, '删除', '档案逻辑删除');

        res.json({ code: 0, message: '删除成功' });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// 批量导入
router.post('/batch-import', (req, res) => {
    const db = req.db;
    const list = req.body;

    if (!Array.isArray(list) || list.length === 0) {
        return res.status(400).json({ code: 400, message: '导入数据不能为空' });
    }

    const result = { success: 0, fail: 0, errors: [] };

    try {
        db.exec('BEGIN TRANSACTION');

        list.forEach((item, index) => {
            const { employee_no, name, department, entry_date, gender = 1, position, id_card, phone, email, contract } = item;

            if (!employee_no || !name || !department || !entry_date) {
                result.fail++;
                result.errors.push({ row: index + 1, message: '缺少必填字段' });
                return;
            }

            const exist = db.prepare('SELECT id FROM employees WHERE employee_no = ?').get(employee_no);
            if (exist) {
                result.fail++;
                result.errors.push({ row: index + 1, message: '工号已存在' });
                return;
            }

            const fields = ['employee_no', 'name', 'gender', 'department', 'position', 'id_card', 'phone', 'email', 'entry_date', 'emergency_contact', 'emergency_phone', 'address'];
            const values = fields.map(f => item[f] || null);

            try {
                const insertResult = db.prepare(
                    `INSERT INTO employees (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`
                ).run(values);
                const empId = insertResult.lastInsertRowid;
                result.success++;

                db.prepare(
                    'INSERT INTO change_history (employee_id, change_type, after_value, remark) VALUES (?, ?, ?, ?)'
                ).run(empId, '入职', JSON.stringify(item), '批量导入');

                if (contract) {
                    db.prepare(
                        'INSERT INTO contracts (employee_id, contract_type, start_date, end_date, remark, is_current) VALUES (?, ?, ?, ?, ?, 1)'
                    ).run(empId, contract.contract_type, contract.start_date, contract.end_date, contract.remark || '');
                }
            } catch (err) {
                result.fail++;
                result.errors.push({ row: index + 1, message: err.message });
            }
        });

        db.exec('COMMIT');
        res.json({ code: 0, message: '导入完成', data: result });
    } catch (err) {
        db.exec('ROLLBACK');
        res.status(500).json({ code: 500, message: err.message });
    }
});

// 获取所有部门列表
router.get('/options/departments', (req, res) => {
    const db = req.db;
    try {
        const rows = db.prepare('SELECT DISTINCT department FROM employees WHERE status = 1 ORDER BY department').all();
        res.json({ code: 0, data: rows.map(r => r.department) });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// 获取所有岗位列表
router.get('/options/positions', (req, res) => {
    const db = req.db;
    try {
        const rows = db.prepare('SELECT DISTINCT position FROM employees WHERE status = 1 AND position IS NOT NULL ORDER BY position').all();
        res.json({ code: 0, data: rows.map(r => r.position) });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

module.exports = router;
