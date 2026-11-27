export type MaturityStatus = "stable" | "refining";

export interface MaturityFrontmatter {
  maturity?: MaturityStatus | string;
  maturityNote?: string;
  reviewedAt?: string | Date;
}

export interface MaturitySpec {
  code: MaturityStatus;
  label: string;
  level: 1 | 2;
  summary: string;
  aiPolicy: string;
}

export const MATURITY_SPECS: readonly MaturitySpec[] = [
  {
    code: "stable",
    label: "안정",
    level: 2,
    summary: "여러 프로젝트에서 오래 써 보며 실무 검증을 거친 기준입니다.",
    aiPolicy: "기본 기준 (프로젝트 예외 규칙이 없으면 그대로 따름)",
  },
  {
    code: "refining",
    label: "다듬는 중",
    level: 1,
    summary: "실무에 적용하며 계속 다듬고 있는 기준으로, 경험이 쌓이면 바뀔 수 있습니다.",
    aiPolicy: "참고 기준 (상황에 맞게 유연하게 판단·확인)",
  },
];

const SPEC_BY_CODE = new Map<string, MaturitySpec>(
  MATURITY_SPECS.map((spec) => [spec.code, spec]),
);

export interface ResolvedMaturity {
  spec: MaturitySpec;
  note?: string;
  reviewedAt?: string;
}

export function specForMaturity(code: string | undefined): MaturitySpec | null {
  if (!code) return null;
  return SPEC_BY_CODE.get(code.trim().toLowerCase()) ?? null;
}

export function formatReviewedAt(value: string | Date | undefined): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const text = String(value).trim();
  return text.length > 0 ? text : undefined;
}

export function resolveMaturity(
  primary?: MaturityFrontmatter,
  fallback?: MaturityFrontmatter,
): ResolvedMaturity | null {
  const rawCode = primary?.maturity ?? fallback?.maturity;
  const spec = typeof rawCode === "string" ? specForMaturity(rawCode) : null;
  if (!spec) return null;

  const note = (primary?.maturityNote ?? fallback?.maturityNote)?.trim() || undefined;
  const reviewedAt = formatReviewedAt(primary?.reviewedAt ?? fallback?.reviewedAt);

  return { spec, note, reviewedAt };
}
