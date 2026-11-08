import type { Meta, SampleOf } from "../catalog/types";
import { Button } from "@astryxdesign/core/Button";
import { HStack } from "@astryxdesign/core/HStack";
import { icon } from "@kit/foundations/icons/solar-icon";
import { Comparison } from "../catalog/Comparison";
import styles from "./swatch.module.css";

const tokens = [
  ["--color-background-body", "바닥"], ["--color-background-surface", "페이지 면"], ["--color-background-card", "올린 면"],
  ["--color-background-popover", "뜬 면"], ["--color-background-muted", "옅은 채움"], ["--color-background-gray", "고른 값 채움"],
  ["--color-border", "내부 구분선"], ["--color-border-emphasized", "바깥 경계"], ["--color-text-primary", "글자"],
  ["--color-text-secondary", "보조 글자"], ["--color-text-disabled", "비활성 글자"], ["--color-accent", "강조(먹색)"],
  ["--color-overlay-hover", "포인터 아래"], ["--focus-outline-color", "키보드 초점"],
];

const meta = { title: "Foundations (디자인 기초)/테마와 색상", id: "foundations-theme", layout: "centered" } satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Tokens: Sample = {
  name: "색 토큰",
  render: () => <ul className={styles.grid} aria-label="색 토큰">
    {tokens.map(([token, label]) => <li key={token} className={styles.swatch}>
      <span className={styles.chip} style={{ background: `var(${token})` }} />
      <strong>{label}</strong><span className={styles.name}>{token}</span>
    </li>)}
  </ul>,
};

export const States: Sample = {
  name: "도구의 상태",
  render: () => <Comparison items={[
    { label: "기본", content: <Button label="필터" variant="tool" isIconOnly icon={icon("filter")} /> },
    { label: "켜짐·열림", content: <Button label="필터 적용 중" variant="view-active" isIconOnly icon={icon("filter", true)} aria-pressed /> },
    { label: "뷰 알약", content: <HStack gap={1}><Button label="리스트" variant="view-active" aria-pressed icon={icon("layout-list", true)} /><Button label="그리드" variant="view" icon={icon("layout-grid")} /></HStack> },
    { label: "비활성", content: <Button label="저장" isDisabled /> },
  ]} />,
};
