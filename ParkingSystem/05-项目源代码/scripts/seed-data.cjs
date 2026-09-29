const { spawnSync } = require('child_process');
const path = require('path');

const serverDir = path.join(__dirname, '..', 'server');
const script = path.join(serverDir, 'scripts', 'seed-data.cjs');

console.log('正在启动跑批测试数据生成（工作目录：server）...');
const result = spawnSync(process.execPath, [script], {
  cwd: serverDir,
  stdio: 'inherit'
});

process.exit(result.status ?? (result.error ? 1 : 0));
