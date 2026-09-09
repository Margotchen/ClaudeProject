const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const { app } = require('../server');
const { initDB } = require('../db/init');

describe('Auth API', () => {
  before(async () => {
    await initDB();
  });

  it('should login with default admin account', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: '123456' });

    assert.strictEqual(res.body.code, 200);
    assert.ok(res.body.data.token);
    assert.strictEqual(res.body.data.user.role, 'system_admin');
  });

  it('should reject wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrong' });

    assert.strictEqual(res.body.code, 4001);
  });

  it('should get profile with token', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: '123456' });

    const token = loginRes.body.data.token;
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);

    assert.strictEqual(res.body.code, 200);
    assert.strictEqual(res.body.data.username, 'admin');
  });
});
