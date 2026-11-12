import type { Meta, SampleOf } from "../catalog/types";
import { Comparison } from "../catalog/Comparison";

const meta = { title: "Foundations (디자인 기초)/면과 경계", id: "foundations-surfaces", layout: "centered", kit: "shadcn" } satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

/** 면은 네 단계다: 바닥(--sidebar) < 페이지(--background, 점 무늬) < 올린 면(--card + 가는 테두리) < 뜬 면(--popover + 그림자). */
export const Levels: Sample = {
  name: "네 단계의 면",
  render: () => <section aria-label="바닥" className="grid w-[min(36rem,100%)] gap-3 rounded-xl bg-sidebar p-4">
    <span className="text-xs text-muted-foreground">바닥 · bg-sidebar</span>
    <div className="grid gap-3 squircle rounded-surface bg-background bg-dots p-4 shadow-surface">
      <span className="text-xs text-muted-foreground">페이지 면 · bg-background bg-dots</span>
      <div className="rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">올린 면 · 카드(bg-card)</div>
      <div className="rounded-lg bg-popover p-3 text-sm shadow-md ring-1 ring-foreground/10">뜬 면 · 메뉴(bg-popover)</div>
    </div>
  </section>,
};

/** 모서리: 요소 8px, 메뉴 항목 · 만들기 10px(초타원), 카드 12px 안팎, 앱 본문 면 16px(초타원), 알약은 둥글게. */
const radii: [label: string, className: string][] = [
  ["8px 입력 · 메뉴", "rounded-lg"], ["10px 만들기 버튼", "squircle rounded-[0.625rem]"], ["12px 카드", "rounded-xl"],
  ["16px 앱 본문 면", "squircle rounded-surface"], ["알약", "rounded-full"],
];
export const Radius: Sample = {
  name: "모서리",
  render: () => <Comparison items={radii.map(([label, className]) => ({
    label, content: <span className={`block h-12 w-16 border bg-card ${className}`} />,
  }))} />,
};
