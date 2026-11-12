import type { Meta, SampleOf } from "../catalog/types";
import { Button } from "@/shared/ui/button";
import { LayoutGridIcon, ListFilterIcon, ListIcon } from "@/shared/ui/icon";
import { Comparison } from "../catalog/Comparison";

/**
 * shadcn 토큰(src/shared/styles/tailwind.css). 강조색은 글자색(먹색 · 흰색)이고 나머지 회색은 글자색을 면에 섞어 만든다.
 * 칩의 클래스는 빌드가 찾도록 글자 그대로 둔다.
 */
const tokens: [token: string, label: string, chip: string][] = [
  ["--sidebar", "바닥", "bg-sidebar"], ["--background", "페이지 면", "bg-background"], ["--card", "올린 면", "bg-card"],
  ["--popover", "뜬 면", "bg-popover"], ["--muted", "옅은 채움", "bg-muted"], ["--secondary", "알약 · 도구 면", "bg-secondary"],
  ["--pressed", "고른 값 채움", "bg-pressed"], ["--accent", "포인터 아래", "bg-accent"], ["--border", "내부 구분선", "bg-border"],
  ["--input", "입력 · 바깥 경계", "bg-input"], ["--foreground", "글자", "bg-foreground"], ["--muted-foreground", "보조 글자", "bg-muted-foreground"],
  ["--icon-muted", "보조 아이콘", "bg-icon-muted"], ["--primary", "강조(먹색)", "bg-primary"], ["--destructive", "되돌릴 수 없음", "bg-destructive"],
  ["--ring", "키보드 초점", "bg-ring"],
];

const meta = { title: "Foundations (디자인 기초)/테마와 색상", id: "foundations-theme", layout: "centered" } satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Tokens: Sample = {
  name: "색 토큰",
  render: () => <ul aria-label="색 토큰" className="m-0 grid w-[min(48rem,100%)] list-none grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-3 p-4">
    {tokens.map(([token, label, chip]) => <li key={token} className="flex min-w-0 flex-col gap-1">
      <span className={`h-12 rounded-lg ring-1 ring-border ring-inset ${chip}`} />
      <strong className="text-sm font-semibold">{label}</strong>
      <span className="font-mono text-xs break-all text-muted-foreground">{token}</span>
    </li>)}
  </ul>,
};

export const States: Sample = {
  name: "도구의 상태",
  render: () => <Comparison items={[
    { label: "기본", content: <Button variant="tool" size="icon" aria-label="필터"><ListFilterIcon /></Button> },
    { label: "켜짐·열림", content: <Button variant="view-active" size="icon" aria-label="필터 적용 중" aria-pressed><ListFilterIcon chosen /></Button> },
    { label: "뷰 알약", content: <div className="flex gap-1">
      <Button variant="view-active" aria-pressed><ListIcon chosen data-icon="inline-start" />리스트</Button>
      <Button variant="view" aria-pressed={false}><LayoutGridIcon data-icon="inline-start" />그리드</Button>
    </div> },
    { label: "비활성", content: <Button disabled>저장</Button> },
  ]} />,
};
