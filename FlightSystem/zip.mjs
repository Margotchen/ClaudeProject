import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ZipArchive } from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = __dirname;
const output = fs.createWriteStream(path.join(root, 'FlightSystem.zip'));
const archive = new ZipArchive({ zlib: { level: 9 } });

const exclude = ['node_modules', 'dist', '.claude', '.git', 'FlightSystem.zip', 'zip.mjs', 'create-zip.ps1'];

function shouldInclude(name) {
  return !exclude.includes(name);
}

function addDir(srcPath, archivePath) {
  const items = fs.readdirSync(srcPath);
  for (const item of items) {
    if (!shouldInclude(item)) continue;
    const fullPath = path.join(srcPath, item);
    const entryPath = path.join(archivePath, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      addDir(fullPath, entryPath);
    } else {
      archive.file(fullPath, { name: entryPath });
    }
  }
}

output.on('close', () => {
  console.log('Archive created: FlightSystem.zip (' + archive.pointer() + ' bytes)');
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

const topDirs = ['01-PRD文档', '02-技术方案', '03-测试报告', '04-AI对话记录', '05-项目源代码'];
for (const dir of topDirs) {
  addDir(path.join(root, dir), dir);
}

archive.finalize();
