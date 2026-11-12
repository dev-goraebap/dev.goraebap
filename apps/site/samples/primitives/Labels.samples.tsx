import type { Meta, SampleOf } from "../catalog/types";
import { Badge } from "@/shared/ui/badge";
import { FileTextIcon } from "@/shared/ui/icon";
import { Comparison } from "../catalog/Comparison";

const meta = { title: "Primitives (기본 부품)/라벨·상태·개수", id: "primitives-labels", layout: "centered" } satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

/** 라벨은 Badge의 label 변형(둥근 알약). 네모나면 버튼으로 읽힌다. */
export const Tokens: Sample = {
  name: "라벨(Token)",
  render: () => <Comparison items={[
    { label: "분류", content: <Badge variant="label">디자인 참고</Badge> },
    { label: "아이콘", content: <Badge variant="label"><FileTextIcon data-icon="inline-start" />문서</Badge> },
    { label: "링크", content: <Badge variant="label" render={<a href="#" />} className="hover:bg-accent">개발 자료</Badge> },
  ]} />,
};

/**
 * 키트에는 상태 점 부품이 없어 업무 표식 색(--mark-*)으로 그린다. 색만으로 뜻을 전하지 않도록 이름을 곁에 둔다.
 * 클래스는 빌드가 찾도록 글자 그대로 둔다.
 */
const dots: [name: string, label: string, color: string][] = [
  ["neutral", "대기", "bg-mark-backlog"], ["accent", "진행", "bg-primary"], ["success", "완료", "bg-mark-done"],
  ["warning", "주의", "bg-mark-medium"], ["error", "실패", "bg-mark-urgent"],
];
export const Status: Sample = {
  name: "상태(StatusDot)",
  render: () => <Comparison items={dots.map(([name, label, color]) => ({
    label: name, content: <span className="flex items-center gap-1.5 text-xs"><span aria-hidden className={`size-2 rounded-full ${color}`} />{label}</span>,
  }))} />,
};
export const Counts: Sample = {
  name: "개수(Badge)",
  render: () => <Comparison items={[
    { label: "개수", content: <Badge variant="secondary" className="tabular-nums">3</Badge> },
    { label: "많음", content: <Badge variant="secondary" className="tabular-nums">99+</Badge> },
  ]} />,
};
