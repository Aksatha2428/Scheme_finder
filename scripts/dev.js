import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 Starting Scheme Finder Fullstack Environment...\n');

// 1. Launch Backend Server on port 3001
const serverProcess = spawn(process.execPath, [path.resolve(rootDir, 'server', 'index.js')], {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env, PORT: process.env.PORT || '3001' }
});

// 2. Launch Vite Frontend Dev Server on port 5173
const viteBin = path.resolve(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');
const viteProcess = spawn(process.execPath, [viteBin], {
  cwd: rootDir,
  stdio: 'inherit',
  env: process.env
});

function cleanup() {
  console.log('\n🛑 Shutting down Scheme Finder servers...');
  try { serverProcess.kill(); } catch (e) {}
  try { viteProcess.kill(); } catch (e) {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
