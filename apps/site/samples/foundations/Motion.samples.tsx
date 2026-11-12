import type { Meta, SampleOf } from "../catalog/types";
import { Button } from "@/shared/ui/button";
import { PageState } from "@/shared/ui/page-state";
import { useState } from "react";

const meta = { title: "Foundations (디자인 기초)/모션", id: "foundations-motion", layout: "centered" } satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

/** 상태 문구는 420ms 동안 아래에서 살짝 떠오른다(page-state-enter). 움직임 줄이기를 켜면 바로 놓인다(motion-safe). */
function Arrival() {
  const [key, setKey] = useState(0);
  return <div className="flex w-[min(30rem,100vw-2rem)] flex-col items-center gap-2">
    <Button variant="secondary" size="sm" onClick={() => setKey(key + 1)}>다시 나타내기</Button>
    <PageState key={key} kind="empty" title="아직 자료가 없습니다" isCompact />
  </div>;
}
export const StateArrival: Sample = { name: "상태 문구가 자리 잡기", render: () => <Arrival /> };
