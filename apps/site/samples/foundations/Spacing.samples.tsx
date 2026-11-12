import type { Meta, SampleOf } from "../catalog/types";
import { Button } from "@/shared/ui/button";
import { SearchIcon } from "@/shared/ui/icon";
import { Input } from "@/shared/ui/input";
import { Comparison } from "../catalog/Comparison";

const meta = { title: "Foundations (디자인 기초)/간격과 크기", id: "foundations-spacing", layout: "centered", kit: "shadcn" } satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

/** Tailwind 간격은 --spacing(0.25rem = 4px)의 배수다. 클래스는 빌드가 찾도록 글자 그대로 둔다. */
const steps: [step: string, px: number, width: string][] = [
  ["0.5", 2, "w-0.5"], ["1", 4, "w-1"], ["1.5", 6, "w-1.5"], ["2", 8, "w-2"], ["3", 12, "w-3"], ["4", 16, "w-4"],
  ["5", 20, "w-5"], ["6", 24, "w-6"], ["8", 32, "w-8"], ["10", 40, "w-10"], ["12", 48, "w-12"],
];
export const Scale: Sample = {
  name: "간격 토큰",
  render: () => <ul aria-label="간격" className="m-0 grid w-[min(48rem,100%)] list-none gap-3 p-4">
    {steps.map(([step, px, width]) => <li key={step} className="grid grid-cols-[9rem_minmax(0,1fr)] items-center gap-3">
      <span className="font-mono text-xs text-muted-foreground">gap-{step} · {px}px</span>
      <span className={`h-4 rounded-sm bg-muted-foreground/40 ${width}`} />
    </li>)}
  </ul>,
};

/** 데스크톱은 28px 줄에 맞추고, 휴대폰(64rem 미만)은 누르는 자리를 키운다: 버튼 36px, 툴바 도구 44px, 입력 48px. */
export const Controls: Sample = {
  name: "컨트롤 크기",
  render: () => <Comparison items={[
    { label: "sm · 28px", content: <Button size="sm">저장</Button> },
    { label: "기본 · 28px(휴대폰 36px)", content: <Button>저장</Button> },
    { label: "도구 · 28px(휴대폰 44px)", content: <Button variant="tool" size="icon" aria-label="검색" className="max-md:size-11"><SearchIcon /></Button> },
    { label: "lg · 36px", content: <Button size="lg">저장</Button> },
    { label: "입력 칸 · 36px(휴대폰 48px)", content: <Input aria-label="이름" placeholder="이름" className="w-40" /> },
  ]} />,
};
