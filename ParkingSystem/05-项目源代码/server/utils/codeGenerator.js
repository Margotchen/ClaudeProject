const dayjs = require('./dayjs');

function generateReservationNo() {
  const prefix = 'RP';
  const dateStr = dayjs().format('YYYYMMDD');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${dateStr}${random}`;
}

module.exports = { generateReservationNo };
