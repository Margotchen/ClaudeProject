const express = require('express');
const router = express.Router();
const dayjs = require('dayjs');
const isoWeek = require('dayjs/plugin/isoWeek');
dayjs.extend(isoWeek);

// 合同到期提醒
router.get('/contract', (req, res) => {
    const db = req.db;
    const today = dayjs();

    const sql = `
        SELECT
            e.id, e.employee_no, e.name, e.department, e.position,
            c.id as contract_id, c.contract_type, c.start_date, c.end_date,
            c.renewal_count
        FROM employees e
        INNER JOIN contracts c ON e.id = c.employee_id
        WHERE e.status = 1 AND c.is_current = 1 AND c.contract_type = 1
        ORDER BY c.end_date ASC
    `;

    try {
        const rows = db.prepare(sql).all();
        const result = rows.map(row => {
            const endDate = dayjs(row.end_date);
            const diffDays = endDate.diff(today, 'day');
            let level = 'safe';
            let label = '正常';

            if (diffDays < 0) {
                level = 'danger';
                label = `已过期 ${Math.abs(diffDays)} 天`;
            } else if (diffDays <= 7) {
                level = 'danger';
                label = `剩余 ${diffDays} 天`;
            } else if (diffDays <= 15) {
                level = 'warning';
                label = `剩余 ${diffDays} 天`;
            } else if (diffDays <= 30) {
                level = 'primary';
                label = `剩余 ${diffDays} 天`;
            }

            return { ...row, remaining_days: diffDays, level, label };
        }).filter(row => row.remaining_days <= 30);

        res.json({ code: 0, data: result });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// 入职周年提醒（本月 / 本周）
router.get('/anniversary', (req, res) => {
    const db = req.db;
    const { scope = 'month' } = req.query;
    const today = dayjs();

    try {
        const rows = db.prepare('SELECT * FROM employees WHERE status = 1').all();
        const result = rows.map(row => {
            const entry = dayjs(row.entry_date);
            const currentYear = today.year();
            const anniversaryThisYear = dayjs(`${currentYear}-${entry.format('MM-DD')}`);
            let years = currentYear - entry.year();

            if (today.isBefore(anniversaryThisYear, 'day')) {
                years -= 1;
            }

            return {
                ...row,
                entry_year: entry.year(),
                anniversary_date: anniversaryThisYear.format('YYYY-MM-DD'),
                anniversary_years: years,
                is_key_year: [1, 3, 5, 10].includes(years)
            };
        }).filter(row => {
            if (row.anniversary_years <= 0) return false;
            const anniv = dayjs(row.anniversary_date);
            return scope === 'week'
                ? anniv.isoWeek() === today.isoWeek() && anniv.year() === today.year()
                : anniv.month() === today.month() && anniv.year() === today.year();
        });

        res.json({ code: 0, data: result });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// 生日提醒（本月）
router.get('/birthday', (req, res) => {
    const db = req.db;
    const today = dayjs();
    const currentMonth = today.month() + 1;

    try {
        const rows = db.prepare('SELECT * FROM employees WHERE status = 1 AND id_card IS NOT NULL').all();
        const result = rows.map(row => {
            const birthday = parseBirthdayFromIdCard(row.id_card);
            return {
                ...row,
                birthday,
                birthday_month: birthday ? dayjs(birthday).month() + 1 : null,
                birthday_day: birthday ? dayjs(birthday).date() : null
            };
        }).filter(row => row.birthday_month === currentMonth);

        res.json({ code: 0, data: result });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// 提醒规则配置
router.get('/config', (req, res) => {
    const db = req.db;
    try {
        const rows = db.prepare('SELECT * FROM reminder_config ORDER BY reminder_type, days_before').all();
        res.json({ code: 0, data: rows });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

router.put('/config', (req, res) => {
    const db = req.db;
    const configs = req.body;

    if (!Array.isArray(configs)) {
        return res.status(400).json({ code: 400, message: '配置数据格式错误' });
    }

    try {
        db.exec('BEGIN TRANSACTION');
        const stmt = db.prepare('UPDATE reminder_config SET days_before = ?, level = ?, enabled = ? WHERE id = ?');
        configs.forEach(cfg => {
            stmt.run(cfg.days_before, cfg.level, cfg.enabled, cfg.id);
        });
        db.exec('COMMIT');
        res.json({ code: 0, message: '配置更新成功' });
    } catch (err) {
        db.exec('ROLLBACK');
        res.status(500).json({ code: 500, message: err.message });
    }
});

// 祝福文案模板
router.get('/templates', (req, res) => {
    res.json({
        code: 0,
        data: {
            anniversary: [
                '感谢您与公司携手走过 {n} 个春秋，愿未来继续同行，共创辉煌！',
                '入职 {n} 周年快乐，感谢一路以来的付出与坚持！'
            ],
            birthday: [
                '祝您生日快乐，身体健康，工作顺利！',
                '在这特别的日子里，愿幸福与快乐常伴您左右，生日快乐！'
            ]
        }
    });
});

// 从身份证号解析生日，支持 18 位与 15 位
function parseBirthdayFromIdCard(idCard) {
    if (!idCard) return null;
    const cleaned = String(idCard).trim();
    if (/^\d{18}$/.test(cleaned) || /^\d{17}[\dXx]$/.test(cleaned)) {
        return `${cleaned.substring(6, 10)}-${cleaned.substring(10, 12)}-${cleaned.substring(12, 14)}`;
    }
    if (/^\d{15}$/.test(cleaned)) {
        const year = '19' + cleaned.substring(6, 8);
        return `${year}-${cleaned.substring(8, 10)}-${cleaned.substring(10, 12)}`;
    }
    return null;
}

module.exports = router;
