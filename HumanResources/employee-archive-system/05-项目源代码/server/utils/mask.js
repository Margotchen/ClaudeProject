// 手机号脱敏：138****1234
function maskPhone(phone) {
    if (!phone || phone.length < 7) return phone;
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

// 身份证号脱敏：前 6 后 4
function maskIdCard(idCard) {
    if (!idCard || idCard.length < 10) return idCard;
    return idCard.replace(/(.{6}).+(.{4})/, '$1********$2');
}

module.exports = { maskPhone, maskIdCard };
