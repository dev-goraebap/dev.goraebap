import type { Meta, SampleOf } from "../catalog/types";
import { Button } from "@astryxdesign/core/Button";
import { VStack } from "@astryxdesign/core/VStack";
import { PageState } from "@/shared/ui/composites/state/PageState";
import { useState } from "react";

const meta = { title: "Foundations (디자인 기초)/모션", id: "foundations-motion", layout: "centered" } satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

function Arrival() {
  const [key, setKey] = useState(0);
  return <VStack gap={2} hAlign="center" width="min(30rem, 100vw - 2rem)">
    <Button label="다시 나타내기" variant="secondary" size="sm" onClick={() => setKey(key + 1)} />
    <PageState key={key} kind="empty" title="아직 자료가 없습니다" isCompact />
  </VStack>;
}
export const StateArrival: Sample = { name: "상태 문구가 자리 잡기", render: () => <Arrival /> };
