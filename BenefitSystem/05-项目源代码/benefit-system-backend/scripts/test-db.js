const db = require('../models');

async function test() {
  try {
    console.log('Testing sync...');
    await db.sequelize.sync();
    console.log('Sync OK');
    const roles = await db.SysRole.findAll();
    console.log('Roles:', roles.map(r => r.role_name));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await db.sequelize.close();
  }
}

test();
