const express = require('express');
const router = express.Router();
const { validateContract } = require('../middleware/validator');

// 获取员工合同列表
router.get('/employee/:employeeId', (req, res) => {
    const { employeeId } = req.params;
    const db = req.db;

    try {
        const rows = db.prepare('SELECT * FROM contracts WHERE employee_id = ? ORDER BY start_date DESC').all(employeeId);
        res.json({ code: 0, data: rows });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// 新增合同
router.post('/', validateContract, (req, res) => {
    const db = req.db;
    const { employee_id, contract_type, start_date, end_date, remark } = req.body;

    try {
        db.prepare('UPDATE contracts SET is_current = 0 WHERE employee_id = ? AND is_current = 1').run(employee_id);
        const insertResult = db.prepare(
            'INSERT INTO contracts (employee_id, contract_type, start_date, end_date, remark, is_current) VALUES (?, ?, ?, ?, ?, 1)'
        ).run(employee_id, contract_type, start_date, end_date || null, remark || '');

        db.prepare(
            'INSERT INTO change_history (employee_id, change_type, after_value, remark) VALUES (?, ?, ?, ?)'
        ).run(employee_id, '合同签订', JSON.stringify(req.body), '新签/续签合同');

        res.json({ code: 0, message: '合同创建成功', data: { id: insertResult.lastInsertRowid } });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// 更新合同
router.put('/:id', validateContract, (req, res) => {
    const { id } = req.params;
    const db = req.db;
    const { contract_type, start_date, end_date, remark } = req.body;

    try {
        db.prepare('UPDATE contracts SET contract_type = ?, start_date = ?, end_date = ?, remark = ? WHERE id = ?').run(
            contract_type, start_date, end_date || null, remark || '', id
        );
        res.json({ code: 0, message: '更新成功' });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// 续签合同：基于当前合同创建新合同，原合同标记为历史，续签次数 +1
router.post('/:id/renew', (req, res) => {
    const { id } = req.params;
    const db = req.db;
    const { start_date, end_date, remark } = req.body;

    try {
        const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(id);
        if (!contract) return res.status(404).json({ code: 404, message: '合同不存在' });

        db.prepare('UPDATE contracts SET is_current = 0 WHERE employee_id = ? AND is_current = 1').run(contract.employee_id);
        const insertResult = db.prepare(
            'INSERT INTO contracts (employee_id, contract_type, start_date, end_date, remark, is_current, renewal_count) VALUES (?, ?, ?, ?, ?, 1, ?)'
        ).run(contract.employee_id, contract.contract_type, start_date, end_date || null, remark || '', contract.renewal_count + 1);

        db.prepare(
            'INSERT INTO change_history (employee_id, change_type, before_value, after_value, remark) VALUES (?, ?, ?, ?, ?)'
        ).run(contract.employee_id, '续签', JSON.stringify(contract), JSON.stringify(req.body), `合同续签，原合同 ID:${id}`);

        res.json({ code: 0, message: '续签成功', data: { id: insertResult.lastInsertRowid } });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

module.exports = router;
