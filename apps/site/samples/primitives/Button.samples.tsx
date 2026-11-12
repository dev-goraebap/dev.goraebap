import type { Meta, SampleOf } from "../catalog/types";
import { Button } from "@/shared/ui/button";
import { ListIcon, MoreHorizontalIcon, PlusIcon, SearchIcon, TableIcon } from "@/shared/ui/icon";
import { Spinner } from "@/shared/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { Comparison } from "../catalog/Comparison";

const meta = {
  title: "Primitives (기본 부품)/버튼", id: "primitives-button", component: Button, layout: "centered", kit: "shadcn",
  args: { children: "저장", variant: "default" },
} satisfies Meta<typeof Button>;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Primary: Sample = { name: "기본" };
export const Variants: Sample = {
  name: "역할과 변형",
  render: () => <Comparison items={[
    { label: "제출", content: <Button>저장</Button> },
    { label: "취소", content: <Button variant="ghost">취소</Button> },
    { label: "보조", content: <Button variant="secondary">다시 시도</Button> },
    { label: "되돌리기 어려움", content: <Button variant="destructive">삭제</Button> },
    { label: "페이지 만들기", content: <Button variant="create"><PlusIcon data-icon="inline-start" />자료 추가</Button> },
    { label: "조용한 동작", content: <Button variant="secondary" size="xs" className="rounded-full">모두 지우기</Button> },
  ]} />,
};
export const Tools: Sample = {
  name: "도구와 뷰",
  render: () => <Comparison items={[
    { label: "도구", content: <Button variant="tool" size="icon" aria-label="검색"><SearchIcon /></Button> },
    { label: "켜진 도구", content: <Button variant="view-active" size="icon" aria-label="검색 중" aria-pressed><SearchIcon chosen /></Button> },
    { label: "뷰 알약", content: <div className="flex gap-1">
      <Button variant="view-active" aria-pressed><ListIcon chosen data-icon="inline-start" />리스트</Button>
      <Button variant="view" aria-pressed={false}><TableIcon data-icon="inline-start" />표</Button>
    </div> },
    { label: "아이콘 버튼", content: <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label="더 보기" />}><MoreHorizontalIcon /></TooltipTrigger>
      <TooltipContent>더 보기</TooltipContent>
    </Tooltip> },
  ]} />,
};
/** 기본 크기는 데스크톱 28px · 휴대폰 36px이다. lg는 어디서나 36px. */
export const Sizes: Sample = {
  name: "크기",
  render: () => <Comparison items={(["sm", "default", "lg"] as const).map(size => ({ label: size === "default" ? "기본" : size, content: <Button size={size}>저장</Button> }))} />,
};
export const States: Sample = {
  name: "상태",
  render: () => <Comparison items={[
    { label: "기본", content: <Button>저장</Button> },
    { label: "비활성", content: <Button disabled>저장</Button> },
    { label: "처리 중", content: <Button disabled><Spinner data-icon="inline-start" />저장</Button> },
  ]} />,
};
