#!/usr/bin/env node
/**
 * 문서 성숙도(maturity) 상태 코드 점검 및 변화 추적 리포트 도구.
 *
 * 상태 코드: stable(안정) | refining(다듬는 중)
 *
 * 사용법:
 *   node scripts/maturity-audit.mjs            # 요약 · 분류 문서 · 경고 · 변화 이력
 *   node scripts/maturity-audit.mjs --unscored # 아직 성숙도가 없는 문서 목록 포함
 *   node scripts/maturity-audit.mjs --json     # AI 감사·자동화용 JSON 출력
 *   node scripts/maturity-audit.mjs --stale=90 # 재검토 임계 일수 지정 (기본 180일)
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_ROOT = path.join(REPO_ROOT, "web", "apps", "blog", "content");

const args = new Set(process.argv.slice(2));
const jsonMode = args.has("--json");
const showUnscored = args.has("--unscored");
const staleArg = [...args].find((arg) => arg.startsWith("--stale="));
const STALE_DAYS = staleArg ? Math.max(1, Number(staleArg.split("=")[1]) || 180) : 180;

const SPECS = [
  { code: "stable", label: "안정", level: 2, aiPolicy: "기본 기준" },
  { code: "refining", label: "다듬는 중", level: 1, aiPolicy: "참고 기준" },
];

const SPEC_BY_CODE = new Map(SPECS.map((spec) => [spec.code, spec]));

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "glossary") continue;
      walk(full, out);
    } else if (/\.(md|mdx)$/.test(entry.name) && entry.name !== "SKILL.md") {
      out.push(full);
    }
  }
  return out;
}

function parseFrontmatter(raw) {
  const normalized = raw.replace(/\r\n/g, "\n");
  const match = /^---\n([\s\S]*?)\n---/.exec(normalized);
  if (!match) return {};
  const meta = {};
  for (const line of match[1].split("\n")) {
    const kv = /^([a-zA-Z0-9_-]+):\s*(.*)$/.exec(line.trim());
    if (!kv) continue;
    meta[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, "");
  }
  return meta;
}

function maturityHistory(relPath) {
  try {
    const out = execFileSync(
      "git",
      ["log", "--follow", "--format=%cs", "-p", "--", relPath],
      { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    );
    const changes = [];
    let currentDate = "";
    for (const line of out.split("\n")) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(line.trim())) {
        currentDate = line.trim();
        continue;
      }
      const added = /^\+maturity:\s*([a-zA-Z_-]+)/.exec(line);
      if (added) {
        const code = added[1].trim().toLowerCase();
        if (SPEC_BY_CODE.has(code)) {
          changes.push({ date: currentDate, code });
        }
      }
    }
    return changes.reverse();
  } catch {
    return [];
  }
}

function daysSince(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const parsed = Date.parse(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(parsed)) return null;
  return Math.floor((Date.now() - parsed) / 86_400_000);
}

const files = walk(CONTENT_ROOT).sort();
const docs = files.map((absPath) => {
  const relPath = path.relative(REPO_ROOT, absPath).replace(/\\/g, "/");
  const contentRel = path.relative(CONTENT_ROOT, absPath).replace(/\\/g, "/");
  const raw = fs.readFileSync(absPath, "utf8");
  const meta = parseFrontmatter(raw);

  const rawCode = meta.maturity?.trim().toLowerCase() || null;
  const spec = rawCode ? SPEC_BY_CODE.get(rawCode) ?? null : null;
  const note = meta.maturityNote?.trim() || null;
  const reviewedAt = meta.reviewedAt?.trim() || null;

  const warnings = [];
  if (rawCode && !spec) {
    warnings.push(`invalid-status(${rawCode})`);
  }
  if (spec && !note) {
    warnings.push("missing-note");
  }
  if (spec) {
    const age = daysSince(reviewedAt);
    if (age === null) warnings.push("missing-reviewed-at");
    else if (age > STALE_DAYS) warnings.push(`stale-review(${age}d)`);
  }

  const history = spec ? maturityHistory(relPath) : [];
  let levelDelta = null;
  if (history.length >= 2) {
    const first = SPEC_BY_CODE.get(history[0].code);
    const last = SPEC_BY_CODE.get(history[history.length - 1].code);
    if (first && last) levelDelta = last.level - first.level;
  }

  return {
    path: relPath,
    contentPath: contentRel,
    title: meta.title || path.basename(absPath),
    status: spec?.code ?? null,
    label: spec?.label ?? null,
    level: spec?.level ?? 0,
    aiPolicy: spec?.aiPolicy ?? null,
    note,
    reviewedAt,
    warnings,
    history,
    levelDelta,
  };
});

const evaluated = docs
  .filter((doc) => doc.status !== null)
  .sort((a, b) => b.level - a.level || a.contentPath.localeCompare(b.contentPath));
const invalid = docs.filter((doc) => doc.status === null && doc.warnings.length > 0);
const unscored = docs.filter((doc) => doc.status === null && doc.warnings.length === 0);
const flagged = [...invalid, ...evaluated.filter((doc) => doc.warnings.length > 0)];
const shifted = evaluated.filter((doc) => doc.levelDelta !== null && doc.levelDelta !== 0);

const summary = {
  total: docs.length,
  evaluated: evaluated.length,
  unscored: unscored.length,
  counts: Object.fromEntries(
    SPECS.map((spec) => [
      spec.code,
      evaluated.filter((doc) => doc.status === spec.code).length,
    ]),
  ),
  flaggedCount: flagged.length,
  shiftedCount: shifted.length,
};

if (jsonMode) {
  process.stdout.write(
    JSON.stringify({ summary, evaluated, flagged, shifted, unscored }, null, 2) + "\n",
  );
  process.exit(0);
}

console.log(
  `\n[성숙도(Maturity) 점검 리포트] 전체 ${summary.total}편 · 분류됨 ${summary.evaluated}편 · 미분류 ${summary.unscored}편`,
);
console.log(
  `분포: ` +
    SPECS.map((spec) => `${spec.label}(${spec.code}) ${summary.counts[spec.code]}편`).join(" · "),
);

if (evaluated.length > 0) {
  console.log("\n=== 분류된 문서 ===");
  for (const doc of evaluated) {
    const warnText = doc.warnings.length ? `  [!] ${doc.warnings.join(", ")}` : "";
    const shiftText =
      doc.levelDelta !== null && doc.levelDelta !== 0
        ? ` (${doc.levelDelta > 0 ? "승격" : "하향"})`
        : "";
    console.log(
      `- [${doc.label} · ${doc.status} · ${doc.aiPolicy}] ${doc.contentPath} — ${doc.title}${shiftText}${warnText}`,
    );
    if (doc.note) console.log(`    근거: ${doc.note}`);
    if (doc.reviewedAt) console.log(`    검토: ${doc.reviewedAt}`);
  }
} else {
  console.log(
    "\n아직 성숙도(maturity)가 적힌 문서가 없습니다. 각 .md/.mdx frontmatter에 아래처럼 추가해 보세요:\n" +
      "  maturity: stable  # stable(안정) | refining(다듬는 중)\n" +
      '  maturityNote: "실무에서 얼마나 검증되었는지, 어떤 조건이면 바뀔지 한 줄"\n' +
      "  reviewedAt: 2026-11-27",
  );
}

if (flagged.length > 0) {
  console.log(`\n=== 보완·재검토 필요 (${flagged.length}편) ===`);
  for (const doc of flagged) {
    console.log(`- ${doc.contentPath}: ${doc.warnings.join(", ")}`);
  }
}

if (shifted.length > 0) {
  console.log(`\n=== 시간차 변화 이력 (${shifted.length}편) ===`);
  for (const doc of shifted) {
    const first = doc.history[0];
    const last = doc.history[doc.history.length - 1];
    const firstLabel = SPEC_BY_CODE.get(first.code)?.label ?? first.code;
    const lastLabel = SPEC_BY_CODE.get(last.code)?.label ?? last.code;
    const direction = doc.levelDelta > 0 ? "승격" : "하향";
    console.log(
      `- ${doc.contentPath}: ${firstLabel}(${first.code}, ${first.date}) → ${lastLabel}(${last.code}, ${last.date}) [${direction}]`,
    );
  }
}

if (showUnscored && unscored.length > 0) {
  console.log(`\n=== 미분류 문서 (${unscored.length}편) ===`);
  for (const doc of unscored) {
    console.log(`- ${doc.contentPath} (${doc.title})`);
  }
}
