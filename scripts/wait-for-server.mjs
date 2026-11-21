#!/usr/bin/env node
/**
 * Waits until the local server answers its health read (GET /api/v1/health, which touches the database), so dev.sh
 * starts the screens only once the API behind them is ready. The address is DEV_API_TARGET when set (the screens'
 * proxy target), else http://localhost:<SERVER_PORT> with SERVER_PORT from the environment or server/.env, 8080 by
 * default. Gives up after five minutes; a server that stopped ends this too, as dev.sh runs both together.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const LIMIT_MS = 5 * 60 * 1000;
const EVERY_MS = 1000;

function serverPort() {
  if (process.env.SERVER_PORT) return process.env.SERVER_PORT;
  try {
    const line = readFileSync(join(root, 'server', '.env'), 'utf8')
      .split(/\r?\n/)
      .find(each => /^\s*SERVER_PORT\s*=/.test(each));
    if (line) return line.split('=')[1].trim();
  } catch {
    /* no server/.env: the default port */
  }
  return '8080';
}

const base = process.env.DEV_API_TARGET ?? `http://localhost:${serverPort()}`;
const health = new URL('/api/v1/health', base).toString();
const started = Date.now();
console.log(`서버 준비를 기다립니다: ${health}`);

/** Whether the server answered its health read; the read gives up after two seconds and leaves nothing running. */
async function isReady() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  try {
    return (await fetch(health, { signal: controller.signal })).ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

// Ends on its own (no process.exit: on Windows that can abort Node while a read is closing, and the screens would not
// start), with the exit code dev.sh reads.
let ready = false;
while (!ready && Date.now() - started <= LIMIT_MS) {
  ready = await isReady();
  if (!ready) await new Promise(resolve => setTimeout(resolve, EVERY_MS));
}
if (ready) console.log(`서버가 준비됐습니다 (${Math.round((Date.now() - started) / 1000)}초). 화면을 띄웁니다.`);
else {
  console.error('5분 안에 서버가 준비되지 않았습니다. 서버 로그를 확인하세요.');
  process.exitCode = 1;
}
