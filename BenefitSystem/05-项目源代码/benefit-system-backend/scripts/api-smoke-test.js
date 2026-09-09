const http = require('http');

const BASE = { hostname: 'localhost', port: 3000 };

function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const options = {
      ...BASE,
      path: `/api${path}`,
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) options.headers.Authorization = `Bearer ${token}`;
    if (payload) options.headers['Content-Length'] = Buffer.byteLength(payload);

    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.code !== 200) {
            return reject(new Error(`API error [${path}]: ${json.message}`));
          }
          resolve(json.data);
        } catch (e) {
          reject(new Error(`Invalid JSON [${path}]: ${body}`));
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function login(username, password) {
  const res = await request('post', '/auth/login', { username, password });
  return res.token;
}

async function run() {
  console.log('1. Admin login');
  const adminToken = await login('admin', 'admin123');
  console.log('Admin OK');

  console.log('2. HR login');
  const hrToken = await login('hr', 'hr123');
  console.log('HR OK');

  console.log('3. Employee login');
  const empToken = await login('employee', 'emp123');
  console.log('Employee OK');

  console.log('4. Gift list');
  const gifts = await request('get', '/gifts?page=1&size=10', null, hrToken);
  console.log('Gifts:', gifts.list.map(g => `${g.gift_name}(stock=${g.stock})`).join(', '));

  // 动态选择两个上架礼品，避免测试数据变化导致硬编码失败
  const availableGifts = gifts.list.filter(g => g.status === 1 && g.stock > 10);
  if (availableGifts.length < 2) {
    throw new Error('上架礼品数量不足，无法完成测试');
  }
  const [gift1, gift2] = availableGifts.slice(0, 2);

  console.log('5. Create activity');
  const now = new Date();
  const start = new Date(now.getTime() - 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
  const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
  const activity = await request('post', '/activities', {
    activity_name: '测试中秋节福利活动',
    activity_type: 'holiday',
    start_time: start,
    end_time: end,
    limit_count: 2,
    description: '测试活动'
  }, hrToken);
  console.log('Activity created:', activity.id);

  console.log('5.1 Configure activity gifts');
  await request('put', `/activities/${activity.id}/gifts`, {
    giftIds: [gift1.id, gift2.id]
  }, hrToken);
  console.log('Gifts configured:', gift1.id, gift2.id);

  console.log('6. Activity list');
  const activities = await request('get', '/activities?page=1&size=10', null, hrToken);
  console.log('Activities:', activities.list.map(a => `${a.activity_name}(${a.status})`).join(', '));

  console.log('7. Employee add address');
  const address = await request('post', '/addresses', {
    receiver: '测试员工',
    phone: '13800138000',
    province: '广东省',
    city: '深圳市',
    district: '南山区',
    detail_address: '科技园测试大厦',
    is_default: 1
  }, empToken);
  console.log('Address added:', address.id);

  console.log('8. Employee submit apply');
  const apply = await request('post', '/apply', {
    activityId: activity.id,
    addressId: address.id,
    items: [
      { giftId: gift1.id, quantity: 1 },
      { giftId: gift2.id, quantity: 1 }
    ]
  }, empToken);
  console.log('Apply submitted:', apply.id);

  console.log('9. Gift stock after apply');
  const gift1After = await request('get', `/gifts/${gift1.id}`, null, hrToken);
  const gift2After = await request('get', `/gifts/${gift2.id}`, null, hrToken);
  console.log(`${gift1After.gift_name} stock=${gift1After.stock}, ${gift2After.gift_name} stock=${gift2After.stock}`);

  console.log('10. HR deliver');
  await request('put', `/deliver/${apply.id}`, {
    expressCompany: '顺丰速运',
    expressNo: 'SF1234567890'
  }, hrToken);
  console.log('Delivered');

  console.log('11. Employee sign');
  await request('put', `/sign/${apply.id}`, {
    feedback: '礼品已收到，非常满意！'
  }, empToken);
  console.log('Signed');

  console.log('12. Apply detail');
  const detail = await request('get', `/apply/${apply.id}`, null, empToken);
  console.log('Apply status:', detail.apply_status, 'express:', detail.express_no, 'feedback:', detail.feedback);

  console.log('13. Statistics');
  const stats = await request('get', '/statistics/dashboard', null, hrToken);
  console.log('Dashboard:', JSON.stringify(stats, null, 2));

  console.log('\nAll tests passed!');
}

run().catch(err => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
