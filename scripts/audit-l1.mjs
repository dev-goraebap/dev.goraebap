#!/usr/bin/env node
/**
 * L1 무인 정적 감사 스크립트 (AI 토큰 0원).
 *
 * 점검 항목:
 * 1. plugins/fullstack 빌드 정합성 · 중립성 · 로컬 링크 · 앵커 (npm run check)
 * 2. 예시 코드의 GitHub 40자리 고정 커밋 링크 유효성 (npm run check:links)
 * 3. 문서 성숙도(maturity) 경고 및 180일 초과 재검토 대상 (scripts/maturity-audit.mjs)
 * 4. web/ 의존성 보안 취약점 (pnpm audit --audit-level=moderate --json)
 *
 * 사용법:
 *   node scripts/audit-l1.mjs
 *   node scripts/audit-l1.mjs --out /tmp/audit-l1.json
 *   node scripts/audit-l1.mjs --skip-links
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const skipLinks = args.includes("--skip-links");
const outIdx = args.indexOf("--out");
const outFile = outIdx !== -1 ? args[outIdx + 1] : null;
const isWin = process.platform === "win32";

function run(cmd, cmdArgs, cwd = REPO_ROOT) {
  const result = isWin
    ? spawnSync(process.env.ComSpec || "cmd.exe", ["/d", "/c", cmd, ...cmdArgs], {
        cwd,
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
      })
    : spawnSync(cmd, cmdArgs, {
        cwd,
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
      });
  return {
    ok: result.status === 0,
    status: result.status ?? 1,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim(),
  };
}

const findings = [];
const sections = [];

// 1) plugins/fullstack check (순수성 · 링크 · 앵커 · dist 정합성)
const pluginCheck = run("npm", ["run", "check"], path.join(REPO_ROOT, "plugins/fullstack"));
if (!pluginCheck.ok) {
  findings.push({
    kind: "plugin-check",
    title: "fullstack 플러그인 정합성·순수성 검사 실패",
    detail: (pluginCheck.stderr || pluginCheck.stdout).slice(0, 1500),
  });
  sections.push(
    `### 1. 플러그인 정합성 · 중립성 검사 — 실패\n\`\`\`text\n${(pluginCheck.stderr || pluginCheck.stdout).slice(0, 1500)}\n\`\`\``,
  );
} else {
  sections.push(`### 1. 플러그인 정합성 · 중립성 검사 — 정상\n- ${pluginCheck.stdout.split("\n").pop()}`);
}

// 2) 고정 커밋 링크 검사 (온라인)
if (!skipLinks) {
  const linksCheck = run("npm", ["run", "check:links"], path.join(REPO_ROOT, "plugins/fullstack"));
  if (!linksCheck.ok) {
    findings.push({
      kind: "broken-links",
      title: "외부 고정 커밋 링크 검사 실패",
      detail: (linksCheck.stderr || linksCheck.stdout).slice(0, 1500),
    });
    sections.push(
      `### 2. 외부 고정 커밋 링크 — 실패\n\`\`\`text\n${(linksCheck.stderr || linksCheck.stdout).slice(0, 1500)}\n\`\`\``,
    );
  } else {
    sections.push(`### 2. 외부 고정 커밋 링크 — 정상\n- ${linksCheck.stdout.split("\n").pop() || "확인 완료"}`);
  }
}

// 3) 문서 성숙도 · 노후 검토 대상 (180일 초과 또는 메타 누락)
const maturityRun = run("node", ["scripts/maturity-audit.mjs", "--json", "--stale=180"]);
if (maturityRun.ok && maturityRun.stdout) {
  const report = JSON.parse(maturityRun.stdout);
  if (report.flagged?.length > 0) {
    findings.push({
      kind: "maturity-stale",
      title: `문서 성숙도 보완·재검토 필요 (${report.flagged.length}편)`,
      items: report.flagged.map((doc) => `${doc.contentPath}: ${doc.warnings.join(", ")}`),
    });
    const list = report.flagged
      .slice(0, 20)
      .map((doc) => `- \`${doc.contentPath}\`: ${doc.warnings.join(", ")}`)
      .join("\n");
    sections.push(`### 3. 문서 성숙도 · 재검토 — 보완 필요 (${report.flagged.length}편)\n${list}`);
  } else {
    sections.push(
      `### 3. 문서 성숙도 · 재검토 — 정상\n- 전체 ${report.summary.total}편 중 분류 ${report.summary.evaluated}편, 경고 0편`,
    );
  }
} else {
  findings.push({
    kind: "maturity-error",
    title: "maturity-audit 실행 오류",
    detail: (maturityRun.stderr || maturityRun.stdout).slice(0, 800),
  });
}

// 4) web/ 의존성 보안 취약점 (moderate 이상)
const auditRun = run("pnpm", ["audit", "--audit-level=moderate", "--json"], path.join(REPO_ROOT, "web"));
try {
  const rawJson = auditRun.stdout || auditRun.stderr;
  const parsed = rawJson ? JSON.parse(rawJson) : null;
  const advisories = parsed?.advisories ? Object.values(parsed.advisories) : [];
  const relevant = advisories.filter((adv) =>
    ["moderate", "high", "critical"].includes(String(adv.severity || "").toLowerCase()),
  );
  if (relevant.length > 0) {
    const bySeverity = relevant.reduce((acc, adv) => {
      acc[adv.severity] = (acc[adv.severity] || 0) + 1;
      return acc;
    }, {});
    findings.push({
      kind: "security-audit",
      title: `web/ 의존성 보안 권고 (${relevant.length}건)`,
      bySeverity,
    });
    const lines = relevant
      .slice(0, 15)
      .map(
        (adv) =>
          `- **[${adv.severity}]** \`${adv.module_name}\` (${adv.vulnerable_versions}) — ${adv.title}${adv.patched_versions ? ` (패치: \`${adv.patched_versions}\`)` : ""}`,
      )
      .join("\n");
    sections.push(`### 4. 의존성 보안 감사 (\`web/\`) — 주의 (${relevant.length}건)\n${lines}`);
  } else if (parsed?.error) {
    sections.push(`### 4. 의존성 보안 감사 (\`web/\`) — 레지스트리 조회 건너뜀\n- ${parsed.error.summary || "일시 오류"}`);
  } else {
    sections.push(`### 4. 의존성 보안 감사 (\`web/\`) — 정상\n- moderate 이상 취약점 0건`);
  }
} catch {
  sections.push(`### 4. 의존성 보안 감사 (\`web/\`) — 파싱 불가 (수동 확인 권장)`);
}

const today = new Date().toISOString().slice(0, 10);
const markdown = [
  `## L1 정적 · 보안 · 링크 감사 결과 (${today})`,
  "",
  findings.length > 0
    ? `발견된 항목: **${findings.length}건** (AI 토큰 미사용 정적 검사)`
    : "모든 L1 정적 검사 항목이 정상입니다.",
  "",
  ...sections,
  "",
  "---",
  "_이 리포트는 `.github/workflows/audit-l1.yml`의 `scripts/audit-l1.mjs`가 자동 생성했습니다._",
].join("\n");

const payload = {
  date: today,
  hasFindings: findings.length > 0,
  findingCount: findings.length,
  findings,
  markdown,
};

if (outFile) {
  fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2), "utf8");
}

process.stdout.write(`${markdown}\n`);
