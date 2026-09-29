const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const dayjs = require('dayjs');

const dbPath = path.join(__dirname, 'database', 'employee.db');
const db = new DatabaseSync(dbPath);

const departments = ['技术部', '产品部', '运营部', '市场部', '人事部', '财务部', '销售部', '客服部'];
const positions = ['专员', '主管', '经理', '总监', '工程师', '设计师', '分析师', '顾问'];
const firstNames = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '涛', '明', '超', '秀', '霞', '平', '刚'];
const lastNames = ['王', '李', '张', '刘', '陈', '杨', '黄', '赵', '吴', '周', '徐', '孙', '马', '朱', '胡', '郭', '何', '林', '罗', '高'];

function randomName() {
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const second = Math.random() > 0.5 ? firstNames[Math.floor(Math.random() * firstNames.length)] : '';
    return last + first + second;
}

function randomPhone() {
    const prefix = ['138', '139', '137', '136', '135', '134', '188', '187', '186', '185', '184', '183', '182', '181', '180', '159', '158', '157', '156', '155', '152', '151', '150'][Math.floor(Math.random() * 23)];
    return prefix + String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
}

function randomIdCard(birthDate) {
    const prefix = '110101';
    const birth = birthDate.replace(/-/g, '');
    const seq = String(Math.floor(Math.random() * 999)).padStart(3, '0');
    const base = prefix + birth + seq;
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const codes = '10X98765432';
    let sum = 0;
    for (let i = 0; i < 17; i++) {
        sum += parseInt(base[i], 10) * weights[i];
    }
    return base + codes[sum % 11];
}

function randomBirthDate(minAge, maxAge) {
    const age = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;
    const year = dayjs().year() - age;
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function randomEntryDate() {
    const years = Math.floor(Math.random() * 15);
    const days = Math.floor(Math.random() * 365);
    return dayjs().subtract(years, 'year').subtract(days, 'day').format('YYYY-MM-DD');
}

function randomContractType() {
    const r = Math.random();
    if (r < 0.7) return 1;
    if (r < 0.9) return 2;
    return 3;
}

const employees = [];
for (let i = 1; i <= 120; i++) {
    const birthDate = randomBirthDate(22, 55);
    const entryDate = randomEntryDate();
    const dept = departments[Math.floor(Math.random() * departments.length)];
    const pos = positions[Math.floor(Math.random() * positions.length)];
    const gender = Math.random() > 0.5 ? 1 : 2;

    employees.push({
        employee_no: `E${String(i).padStart(3, '0')}`,
        name: randomName(),
        gender,
        department: dept,
        position: pos,
        id_card: randomIdCard(birthDate),
        phone: randomPhone(),
        email: `e${String(i).padStart(3, '0')}@example.com`,
        entry_date: entryDate,
        status: 1,
        emergency_contact: randomName(),
        emergency_phone: randomPhone(),
        address: `北京市${['海淀', '朝阳', '东城', '西城', '丰台', '石景山'][Math.floor(Math.random() * 6)]}区某某街道 ${Math.floor(Math.random() * 900) + 100} 号`
    });
}

try {
    db.exec('BEGIN TRANSACTION');

    const insertEmp = db.prepare(`
        INSERT INTO employees (employee_no, name, gender, department, position, id_card, phone, email, entry_date, status, emergency_contact, emergency_phone, address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    employees.forEach((emp, index) => {
        const empResult = insertEmp.run(
            emp.employee_no, emp.name, emp.gender, emp.department, emp.position,
            emp.id_card, emp.phone, emp.email, emp.entry_date, emp.status,
            emp.emergency_contact, emp.emergency_phone, emp.address
        );
        const empId = empResult.lastInsertRowid;
        const contractType = randomContractType();
        const today = dayjs();
        let startDate, endDate;

        if (contractType === 1) {
            // 固定期限：起始日期在近 3 年内，跨度 1-3 年
            const startOffset = Math.floor(Math.random() * 1095); // 0-3 年前
            startDate = today.subtract(startOffset, 'day').format('YYYY-MM-DD');
            const duration = Math.floor(Math.random() * 3) + 1;
            endDate = dayjs(startDate).add(duration, 'year').format('YYYY-MM-DD');
            // 前 38 条：让结束日期落在 [-5, 45] 天内，覆盖过期 / 高危 / 预警 / 提示
            if (index < 38) {
                endDate = today.add(Math.floor(Math.random() * 51) - 5, 'day').format('YYYY-MM-DD');
            }
        } else if (contractType === 2) {
            // 无固定期限：仅有起始日期
            const startOffset = Math.floor(Math.random() * 1095);
            startDate = today.subtract(startOffset, 'day').format('YYYY-MM-DD');
            endDate = null;
        } else {
            // 试用期：3-6 个月
            const startOffset = Math.floor(Math.random() * 180);
            startDate = today.subtract(startOffset, 'day').format('YYYY-MM-DD');
            endDate = dayjs(startDate).add(Math.floor(Math.random() * 4) + 3, 'month').format('YYYY-MM-DD');
        }

        db.prepare(
            'INSERT INTO contracts (employee_id, contract_type, start_date, end_date, remark, is_current) VALUES (?, ?, ?, ?, ?, 1)'
        ).run(empId, contractType, startDate, endDate, '自动生成示例合同');

        db.prepare(
            'INSERT INTO change_history (employee_id, change_type, after_value, remark) VALUES (?, ?, ?, ?)'
        ).run(empId, '入职', JSON.stringify(emp), '示例数据初始化');
    });

    db.exec('COMMIT');
    console.log('示例数据导入完成，共 120 条员工记录');
} catch (err) {
    db.exec('ROLLBACK');
    console.error('示例数据导入失败:', err);
} finally {
    db.close();
}
