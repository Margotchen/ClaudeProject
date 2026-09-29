const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const { app } = require('../server');
const { initDB } = require('../db/init');
const { run } = require('../db');

describe('Reservation API', () => {
  let adminToken;
  let employeeToken;
  let spotId;
  let vehicleId;

  before(async () => {
    await initDB();

    // 清空测试数据（先清子表，避免外键约束失败）
    run('DELETE FROM checkin_records');
    run('DELETE FROM violation_records');
    run('DELETE FROM reservations');
    run('DELETE FROM vehicles');

    // 登录
    const adminLogin = await request(app).post('/api/auth/login').send({ username: 'admin', password: '123456' });
    adminToken = adminLogin.body.data.token;

    const empLogin = await request(app).post('/api/auth/login').send({ username: 'employee1', password: '123456' });
    employeeToken = empLogin.body.data.token;

    // 获取一个共享车位
    const spots = await request(app).get('/api/spots?spotType=shared').set('Authorization', `Bearer ${adminToken}`);
    spotId = spots.body.data.list[0].id;

    // 为员工添加车辆
    const vehicle = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ plateNumber: '京A00001', carType: '轿车', color: '黑色' });
    vehicleId = vehicle.body.data.id;
  });

  it('should create a reservation within 3 days', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        spotId,
        vehicleId,
        reserveDate: dateStr,
        timeSlot: 'morning'
      });

    assert.strictEqual(res.body.code, 200);
    assert.ok(res.body.data.id);
  });

  it('should reject reservation beyond 3 days for employee', async () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    const dateStr = future.toISOString().split('T')[0];

    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        spotId,
        vehicleId,
        reserveDate: dateStr,
        timeSlot: 'afternoon'
      });

    assert.strictEqual(res.body.code, 400);
    assert.ok(res.body.message.includes('3'));
  });

  it('should reject duplicate reservation in same slot', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    // 找到另一个共享车位
    const spots = await request(app).get('/api/spots?spotType=shared').set('Authorization', `Bearer ${adminToken}`);
    const spotId2 = spots.body.data.list[1].id;

    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        spotId: spotId2,
        vehicleId,
        reserveDate: dateStr,
        timeSlot: 'morning'
      });

    assert.strictEqual(res.body.code, 400);
    assert.ok(res.body.message.includes('已有有效预约'));
  });
});
