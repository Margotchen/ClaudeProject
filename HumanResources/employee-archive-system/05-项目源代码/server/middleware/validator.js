// 通用参数校验中间件
function validateEmployee(req, res, next) {
    const data = req.body;
    const errors = [];

    if (!data.name || data.name.trim() === '') {
        errors.push('姓名不能为空');
    }
    if (!data.employee_no || data.employee_no.trim() === '') {
        errors.push('工号不能为空');
    }
    if (!data.department || data.department.trim() === '') {
        errors.push('部门不能为空');
    }
    if (!data.entry_date) {
        errors.push('入职日期不能为空');
    }
    if (data.phone && !/^1[3-9]\d{9}$/.test(data.phone)) {
        errors.push('手机号格式不正确');
    }
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('邮箱格式不正确');
    }
    if (data.id_card && !/^\d{15}$|^\d{17}[\dXx]$/.test(data.id_card)) {
        errors.push('身份证号格式不正确');
    }

    if (errors.length > 0) {
        return res.status(400).json({ code: 400, message: errors.join('；') });
    }
    next();
}

function validateContract(req, res, next) {
    const { employee_id, contract_type, start_date, end_date } = req.body;
    const errors = [];

    if (!employee_id) errors.push('员工 ID 不能为空');
    if (!contract_type) errors.push('合同类型不能为空');
    if (!start_date) errors.push('开始日期不能为空');
    if (end_date && new Date(end_date) < new Date(start_date)) {
        errors.push('结束日期不能早于开始日期');
    }

    if (errors.length > 0) {
        return res.status(400).json({ code: 400, message: errors.join('；') });
    }
    next();
}

module.exports = { validateEmployee, validateContract };
