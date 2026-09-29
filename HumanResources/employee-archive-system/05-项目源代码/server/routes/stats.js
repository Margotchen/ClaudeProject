const express = require('express');
const router = express.Router();
const dayjs = require('dayjs');

// 部门人员分布
router.get('/department', (req, res) => {
    const db = req.db;
    try {
        const rows = db.prepare('SELECT department, COUNT(*) as count FROM employees WHERE status = 1 GROUP BY department ORDER BY count DESC').all();
        res.json({ code: 0, data: rows });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// 岗位分布
router.get('/position', (req, res) => {
    const db = req.db;
    try {
        const rows = db.prepare('SELECT position, COUNT(*) as count FROM employees WHERE status = 1 AND position IS NOT NULL GROUP BY position ORDER BY count DESC').all();
        res.json({ code: 0, data: rows });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// 司龄分布
router.get('/seniority', (req, res) => {
    const db = req.db;
    try {
        const rows = db.prepare('SELECT entry_date FROM employees WHERE status = 1').all();
        const today = dayjs();
        const distribution = {
            '1 年以内': 0,
            '1-3 年': 0,
            '3-5 年': 0,
            '5-10 年': 0,
            '10 年以上': 0
        };

        rows.forEach(row => {
            const years = today.diff(dayjs(row.entry_date), 'year', true);
            if (years < 1) distribution['1 年以内']++;
            else if (years < 3) distribution['1-3 年']++;
            else if (years < 5) distribution['3-5 年']++;
            else if (years < 10) distribution['5-10 年']++;
            else distribution['10 年以上']++;
        });

        const data = Object.keys(distribution).map(name => ({ name, count: distribution[name] }));
        res.json({ code: 0, data });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// 按部门下钻查看人员
router.get('/department/:department/employees', (req, res) => {
    const db = req.db;
    const { department } = req.params;
    try {
        const rows = db.prepare('SELECT id, employee_no, name, position, entry_date FROM employees WHERE status = 1 AND department = ? ORDER BY entry_date').all(department);
        res.json({ code: 0, data: rows });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

module.exports = router;
