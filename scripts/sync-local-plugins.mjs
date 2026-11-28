#!/usr/bin/env node
/**
 * 로컬 PC의 Claude Code · Codex · Antigravity 3종 fullstack 플러그인을
 * origin/main 최신 커밋 기준으로 일괄 동기화한다.
 *
 * - origin/main SHA가 마지막 동기화 때와 같으면 1초 내에 종료한다(--force로 강제 실행 가능).
 * - 작업 중인 로컬 브랜치나 작업 트리는 전혀 건드리지 않고 origin/main에서 안전하게 추출한다.
 *
 * 사용법:
 *   node scripts/sync-local-plugins.mjs            # origin/main 변경 시에만 3종 동기화
 *   node scripts/sync-local-plugins.mjs --force    # SHA 동일해도 강제 동기화
 *   node scripts/sync-local-plugins.mjs --schedule-hint  # Windows 작업 스케줄러 등록 명령 출력
 */
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STATE_FILE = path.join(os.homedir(), ".cache", "dev-goraebap", "plugin-sync.json");
const ANTIGRAVITY_DST = path.join(os.homedir(), ".gemini", "config", "plugins", "fullstack");
const ANTIGRAVITY_TREE_PREFIX = "plugins/fullstack/dist/antigravity/plugins/fullstack";

const args = new Set(process.argv.slice(2));
const force = args.has("--force");
const isWin = process.platform === "win32";

if (args.has("--schedule-hint")) {
  const scriptPath = fileURLToPath(import.meta.url);
  console.log("매일 오전 9시 자동 동기화 (Windows PowerShell):");
  console.log(
    `schtasks /Create /SC DAILY /ST 09:00 /TN "DevGoraebapPluginSync" /TR "node \\"${scriptPath}\\"" /F`,
  );
  console.log("\n삭제 시:");
  console.log('schtasks /Delete /TN "DevGoraebapPluginSync" /F');
  process.exit(0);
}

function runCommand(cmd, cmdArgs, options = {}) {
  const res = isWin
    ? spawnSync(process.env.ComSpec || "cmd.exe", ["/d", "/c", cmd, ...cmdArgs], {
        cwd: options.cwd ?? REPO_ROOT,
        encoding: "utf8",
        stdio: options.inherit ? "inherit" : "pipe",
      })
    : spawnSync(cmd, cmdArgs, {
        cwd: options.cwd ?? REPO_ROOT,
        encoding: "utf8",
        stdio: options.inherit ? "inherit" : "pipe",
      });
  return {
    ok: res.status === 0,
    status: res.status ?? 1,
    stdout: (res.stdout || "").trim(),
    stderr: (res.stderr || "").trim(),
  };
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return {};
  }
}

function writeState(next) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(next, null, 2) + "\n", "utf8");
}

// 1) origin/main 최신 커밋 확인 (작업 트리 변경 없음)
const fetchRes = runCommand("git", ["fetch", "origin", "main", "--quiet"]);
if (!fetchRes.ok) {
  console.error("origin/main 조회 실패:", fetchRes.stderr || fetchRes.stdout);
  process.exit(1);
}
const remoteSha = execFileSync("git", ["rev-parse", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
}).trim();
const shortSha = remoteSha.slice(0, 8);
const prevState = readState();

if (!force && prevState.sha === remoteSha && fs.existsSync(path.join(ANTIGRAVITY_DST, "plugin.json"))) {
  console.log(`이미 최신 상태입니다 (origin/main ${shortSha}). 강제 동기화: --force`);
  process.exit(0);
}

console.log(`fullstack 플러그인 동기화 시작 (origin/main ${shortSha})`);
const results = [];

// 2) Claude Code
const hasClaude = runCommand(isWin ? "where" : "which", ["claude"]).ok;
if (hasClaude) {
  runCommand("claude", ["plugin", "marketplace", "update", "dev-goraebap"]);
  let upd = runCommand("claude", ["plugin", "update", "fullstack@dev-goraebap"]);
  if (!upd.ok) {
    runCommand("claude", ["plugin", "marketplace", "add", "dev-goraebap/dev.goraebap"]);
    upd = runCommand("claude", ["plugin", "install", "fullstack@dev-goraebap"]);
  }
  results.push({
    agent: "Claude Code",
    ok: upd.ok,
    note: upd.ok ? "최신화 완료" : (upd.stderr || upd.stdout).split("\n")[0],
  });
} else {
  results.push({ agent: "Claude Code", ok: true, note: "CLI 미설치(건너뜀)" });
}

// 3) Codex
const hasCodex = runCommand(isWin ? "where" : "which", ["codex"]).ok;
if (hasCodex) {
  const mkt = runCommand("codex", ["plugin", "marketplace", "upgrade", "dev-goraebap"]);
  if (!mkt.ok) {
    runCommand("codex", ["plugin", "marketplace", "add", "dev-goraebap/dev.goraebap", "--ref", "main"]);
  }
  const add = runCommand("codex", ["plugin", "add", "fullstack@dev-goraebap"]);
  results.push({
    agent: "Codex",
    ok: add.ok,
    note: add.ok ? "최신화 완료" : (add.stderr || add.stdout).split("\n")[0],
  });
} else {
  results.push({ agent: "Codex", ok: true, note: "CLI 미설치(건너뜀)" });
}

// 4) Antigravity — origin/main 트리에서 작업 트리를 건드리지 않고 직접 추출
try {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "goraebap-agy-sync-"));
  try {
    const fileList = execFileSync(
      "git",
      ["ls-tree", "-r", "--name-only", "origin/main", ANTIGRAVITY_TREE_PREFIX],
      { cwd: REPO_ROOT, encoding: "utf8" },
    )
      .trim()
      .split(/\r?\n/)
      .filter(Boolean);

    if (fileList.length === 0) {
      throw new Error(`origin/main에서 ${ANTIGRAVITY_TREE_PREFIX} 파일을 찾지 못했습니다.`);
    }

    for (const gitPath of fileList) {
      const rel = gitPath.slice(ANTIGRAVITY_TREE_PREFIX.length + 1);
      const outPath = path.join(tmpDir, rel);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      const blob = execFileSync("git", ["show", `origin/main:${gitPath}`], {
        cwd: REPO_ROOT,
        maxBuffer: 10 * 1024 * 1024,
      });
      fs.writeFileSync(outPath, blob);
    }

    fs.rmSync(ANTIGRAVITY_DST, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(ANTIGRAVITY_DST), { recursive: true });
    fs.cpSync(tmpDir, ANTIGRAVITY_DST, { recursive: true });
    results.push({ agent: "Antigravity", ok: true, note: `${fileList.length}개 파일 동기화 완료` });
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
} catch (error) {
  results.push({ agent: "Antigravity", ok: false, note: String(error.message || error) });
}

for (const item of results) {
  console.log(`- [${item.ok ? "OK" : "FAIL"}] ${item.agent}: ${item.note}`);
}

const allOk = results.every((item) => item.ok);
if (allOk) {
  writeState({ sha: remoteSha, syncedAt: new Date().toISOString() });
}
process.exit(allOk ? 0 : 1);
